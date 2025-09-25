import apiClient from '../../data/api/apiClient';

const ImageService = {
  getMyImages: async () => {
    try {
      const response = await apiClient.get('/images/my-images');
      return response.data;
    } catch (error) {
      console.error("Error al obtener las imágenes del usuario:", error.response?.data?.msg || error.message);
      throw new Error(error.response?.data?.msg || 'No se pudieron obtener las imágenes');
    }
  },

  deleteImage: async (imageId) => {
    try {
      const response = await apiClient.delete(`/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error("Error al eliminar la imagen:", error.response?.data?.msg || error.message);
      throw new Error(error.response?.data?.msg || 'No se pudo eliminar la imagen');
    }
  },
};

export default ImageService;
