const DEFAULT_PROJECT_IMAGES = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1464938050520-ef2571cb5fcd?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1577495508326-19a1b3cf65b7?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&h=600&fit=crop"
];
const getRandomProjectImage = () => {
  const randomIndex = Math.floor(Math.random() * DEFAULT_PROJECT_IMAGES.length);
  return DEFAULT_PROJECT_IMAGES[randomIndex];
};
const getProjectImageByIndex = (index) => {
  return DEFAULT_PROJECT_IMAGES[index % DEFAULT_PROJECT_IMAGES.length];
};
export {
  DEFAULT_PROJECT_IMAGES,
  getProjectImageByIndex,
  getRandomProjectImage
};
