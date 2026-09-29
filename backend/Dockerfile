FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /workspace

COPY backend/pom.xml backend/pom.xml
RUN mvn -f backend/pom.xml dependency:go-offline

COPY backend backend
RUN mvn -f backend/pom.xml -DskipTests package

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=build /workspace/backend/target/*.jar /app/app.jar
COPY seed-data /seed-data

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
