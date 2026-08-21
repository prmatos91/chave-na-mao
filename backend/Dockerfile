# Etapa 1: build da aplicacao com Maven Wrapper (nao depende de Maven instalado no host)
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

COPY mvnw .
COPY .mvn .mvn
RUN chmod +x mvnw
COPY pom.xml .
RUN ./mvnw -q -B dependency:go-offline

COPY src src
RUN ./mvnw -q -B clean package -DskipTests

# Etapa 2: imagem final minima, apenas com o JRE e o jar gerado
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S spring && adduser -S spring -G spring
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN chown spring:spring app.jar
USER spring

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=6 \
  CMD wget -qO- http://127.0.0.1:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
