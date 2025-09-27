const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Función para obtener estadísticas de YouTube
async function getYouTubeStats() {
  try {
    const response = await axios.get('https://www.youtube.com/c/SANREMOPADELTV/about');
    const $ = cheerio.load(response.data);
    
    // Extraer estadísticas usando selectores de Cheerio
    const statsElements = $('.about-stat');
    const subscribers = parseSocialNumber(statsElements.eq(0).text());
    const views = parseSocialNumber(statsElements.eq(1).text());
    const videos = parseInt(statsElements.eq(2).text().replace(/[^\d]/g, '')) || 0;
    
    return { subscribers, views, videos };
  } catch (error) {
    console.error('Error al obtener estadísticas de YouTube:', error);
    return { subscribers: 8930, views: 2800000, videos: 525 };
  }
}

// Función para obtener estadísticas de Instagram
async function getInstagramStats() {
  try {
    const response = await axios.get('https://www.instagram.com/sanremopadeltv/');
    const $ = cheerio.load(response.data);
    
    // Extraer estadísticas del script que contiene los datos
    const scripts = $('script').toArray();
    let followers = 0;
    let views = 0;
    
    for (const script of scripts) {
      const content = $(script).html();
      if (content.includes('edge_followed_by')) {
        const match = content.match(/"edge_followed_by":\{"count":(\d+)\}/);
        if (match) followers = parseInt(match[1]);
      }
      
      if (content.includes('video_view_count')) {
        const viewMatches = content.match(/"video_view_count":(\d+)/g);
        if (viewMatches) {
          views = viewMatches.reduce((sum, match) => {
            const count = parseInt(match.match(/"video_view_count":(\d+)/)[1]);
            return sum + count;
          }, 0);
        }
      }
    }
    
    return { followers, views };
  } catch (error) {
    console.error('Error al obtener estadísticas de Instagram:', error);
    return { followers: 13000, views: 4500000 };
  }
}

// Función para obtener estadísticas de TikTok
async function getTikTokStats() {
  try {
    const response = await axios.get('https://www.tiktok.com/@sanremopadeltv');
    const $ = cheerio.load(response.data);
    
    // Extraer estadísticas del script que contiene los datos
    const scripts = $('script').toArray();
    let followers = 0;
    let views = 0;
    
    for (const script of scripts) {
      const content = $(script).html();
      if (content.includes('followerCount')) {
        const match = content.match(/"followerCount":(\d+)/);
        if (match) followers = parseInt(match[1]);
      }
      
      if (content.includes('playCount')) {
        const playMatches = content.match(/"playCount":(\d+)/g);
        if (playMatches) {
          views = playMatches.reduce((sum, match) => {
            const count = parseInt(match.match(/"playCount":(\d+)/)[1]);
            return sum + count;
          }, 0);
        }
      }
    }
    
    return { followers, views };
  } catch (error) {
    console.error('Error al obtener estadísticas de TikTok:', error);
    return { followers: 5100, views: 850000 };
  }
}

// Función para convertir números como "1.2K" o "3.5M" a números enteros
function parseSocialNumber(str) {
  if (!str) return 0;
  
  str = str.trim().replace(/[^\d.KM]/g, '');
  
  if (str.includes('K')) {
    return parseFloat(str) * 1000;
  } else if (str.includes('M')) {
    return parseFloat(str) * 1000000;
  } else {
    return parseInt(str) || 0;
  }
}

// Función principal
async function main() {
  try {
    // Obtener estadísticas de todas las plataformas
    const youtubeStats = await getYouTubeStats();
    const instagramStats = await getInstagramStats();
    const tiktokStats = await getTikTokStats();
    
    // Calcular total de visualizaciones
    const totalViews = youtubeStats.views + instagramStats.views + tikTokStats.views;
    
    // Crear objeto con los datos
    const statsData = {
      youtube: {
        subscribers: youtubeStats.subscribers,
        views: youtubeStats.views,
        videos: youtubeStats.videos,
        lastUpdated: new Date().toISOString()
      },
      instagram: {
        followers: instagramStats.followers,
        views: instagramStats.views,
        lastUpdated: new Date().toISOString()
      },
      tiktok: {
        followers: tikTokStats.followers,
        views: tikTokStats.views,
        lastUpdated: new Date().toISOString()
      },
      totalViews: totalViews,
      lastUpdated: new Date().toISOString()
    };
    
    // Asegurar que el directorio data existe
    const dataDir = path.join(__dirname, '..', '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Guardar los datos en el archivo JSON
    fs.writeFileSync(
      path.join(dataDir, 'stats.json'),
      JSON.stringify(statsData, null, 2)
    );
    
    console.log('Estadísticas actualizadas correctamente');
  } catch (error) {
    console.error('Error al actualizar estadísticas:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
main();
