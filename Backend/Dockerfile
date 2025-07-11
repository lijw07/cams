# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY ["../cams.sln", "./"]
COPY ["../cams.csproj", "./"]
COPY ["../Cams.Tests/Cams.Tests.csproj", "Cams.Tests/"]
RUN dotnet restore

# Copy source code
COPY ../ .

# Build and publish
RUN dotnet build "cams.csproj" -c Release -o /app/build
RUN dotnet publish "cams.csproj" -c Release -o /app/publish --no-restore

# Development stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS dev
WORKDIR /src

# Copy csproj and restore as distinct layers for better caching
COPY ["../cams.sln", "./"]
COPY ["../cams.csproj", "./"]
COPY ["../Cams.Tests/Cams.Tests.csproj", "Cams.Tests/"]
RUN dotnet restore

# Copy everything else
COPY ../ .

# Install minimal tools needed for debugging
RUN apt-get update && \
    apt-get install -y curl && \
    mkdir -p /vsdbg && \
    curl -sSL https://aka.ms/getvsdbgsh | bash /dev/stdin -v latest -l /vsdbg && \
    rm -rf /var/lib/apt/lists/*

# Enable file watcher for hot reload
ENV DOTNET_USE_POLLING_FILE_WATCHER=1
ENV DOTNET_ENVIRONMENT=Development

# Create non-root user for security
RUN adduser --disabled-password --gecos '' dotnetuser && \
    chown -R dotnetuser:dotnetuser /src && \
    mkdir -p /src/bin /src/obj /home/dotnetuser/.nuget && \
    chown -R dotnetuser:dotnetuser /src/bin /src/obj /home/dotnetuser/.nuget && \
    chmod -R 755 /src/bin /src/obj /home/dotnetuser/.nuget

USER dotnetuser

EXPOSE 8080
EXPOSE 57404

# For debugging with hot reload support
ENTRYPOINT ["dotnet", "watch", "run", "--urls", "http://0.0.0.0:8080"]

# Production stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS prod
WORKDIR /app

# Create non-root user
RUN adduser --disabled-password --gecos '' dotnetuser

# Copy from build stage
COPY --from=build /app/publish .

# Set ownership
RUN chown -R dotnetuser:dotnetuser /app
USER dotnetuser

EXPOSE 8080

ENTRYPOINT ["dotnet", "cams.dll"]