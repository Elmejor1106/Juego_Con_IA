pipeline {
    agent any

    stages {
        stage('Build & Test Backend') {
            agent {
                docker {
                    image 'node:18-alpine'  // Imagen ligera con Node y npm
                    args '-v /var/run/docker.sock:/var/run/docker.sock'
                }
            }
            steps {
                dir('backend') {
                    sh 'npm install'
                    sh 'npm run test:cov'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir('backend') {
                    script {
                        docker.build('my-backend-app:latest')
                    }
                }
            }
        }

        stage('Verify Docker') {
            steps {
                sh 'docker --version'
                sh 'docker images | grep my-backend-app || echo "⚠️ No se encontró la imagen"'
            }
        }
    }
}
