# Usar una imagen base oficial de Node.js
FROM node:18-alpine

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copiar los archivos de dependencias
COPY package*.json ./

# Instalar las dependencias del proyecto
RUN npm install

# Copiar el resto de los archivos de la aplicación
COPY . .

# Exponer el puerto en el que corre la aplicación (ajústalo si es diferente)
EXPOSE 3001

# El comando para iniciar la aplicación
CMD [ "node", "server.js" ]