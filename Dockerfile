# Chỉ dùng để đóng gói API lên Railway — DB là Supabase (không chạy Postgres trong container).
# Build từ gốc repo: docker build -f Dockerfile .
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY backend/backend.csproj backend/
WORKDIR /src/backend
RUN dotnet restore backend.csproj
COPY backend/ .
RUN dotnet publish backend.csproj -c Release -o /publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /publish .
RUN chown -R app:app /app
USER app
EXPOSE 8080
# PORT do Railway gán; Program.cs: UseUrls http://0.0.0.0:{PORT}
CMD ["dotnet", "backend.dll"]
