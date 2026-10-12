FROM mcr.microsoft.com/dotnet/sdk:10.0-noble AS build

WORKDIR /src

COPY server.csproj .

RUN dotnet restore

COPY . .

RUN dotnet publish “server.csproj” -c Release -o /app/publish –no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble AS final

WORKDIR /app

COPY –-from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:10000

EXPOSE 10000

ENTRYPOINT [“dotnet”, “server.dll”]