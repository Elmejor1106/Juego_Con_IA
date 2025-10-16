pipeline {
    agent {
        docker {
            image 'docker:20.10.24-dind'
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
