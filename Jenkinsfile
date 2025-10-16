pipeline {
    agent {
        docker {
            image 'node:18-alpine'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }
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

        stage('Test Docker') {
            steps {
                sh 'docker --version'
            }
        }
    }
}
