FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /workspace

COPY pom.xml .
COPY src ./src

RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /workspace/target/backend-0.0.1-SNAPSHOT.jar /app/app.jar

EXPOSE 10000

ENTRYPOINT ["sh", "-c", "exec java -Xms64m -Xmx240m -XX:MaxMetaspaceSize=128m -XX:+UseSerialGC -Dserver.port=${PORT:-10000} -jar /app/app.jar"]