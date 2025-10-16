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

        stage('Test Docker') {
            steps {
                sh 'docker --version'
            }
        }
    }
}
