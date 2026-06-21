# Build stage
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY backend/pom.xml ./backend/
WORKDIR /app/backend
RUN mvn dependency:go-offline
WORKDIR /app
COPY backend/src ./backend/src
WORKDIR /app/backend
RUN mvn clean package -DskipTests

# Run stage
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/backend/target/volunteer-hub-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
