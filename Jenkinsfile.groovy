Arguments
content:
pipeline {
    agent any
    stages {
        stage('Build & Test Backend') {
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
                        def appImage = docker.build('my-backend-app:latest')
                    }
                }
            }
        }
    }
}
file_path:
g:\Sexto Semestre\NUEVAS TECNOLOGIAS DE DESARROLLO\Segundo Corte\Repositorio GitHub\Jenkinsfile