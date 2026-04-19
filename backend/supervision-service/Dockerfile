# Use Eclipse Temurin JDK 17 as base
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY pom.xml ./
COPY src ./src
RUN apk add --no-cache maven
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app
COPY target/supervision-service-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
