pipeline {
    agent any

    stages {
        stage('Build & Test Backend') {
            agent {
                docker {
                    image 'node:18'              // Usa Node 18 para ejecutar npm
                    args '-v /var/run/docker.sock:/var/run/docker.sock' // Acceso al socket Docker
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
                        // Construye imagen Docker para el backend
                        def appImage = docker.build('my-backend-app:latest')
                    }
                }
            }
        }
    }
}
