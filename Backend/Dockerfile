# Sử dụng hình ảnh .NET SDK để biên dịch code
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy file project và restore các thư viện NuGet
COPY *.csproj ./
RUN dotnet restore

# Copy toàn bộ code còn lại và xuất bản ứng dụng (Publish)
COPY . ./
RUN dotnet publish -c Release -o /app

# Sử dụng hình ảnh .NET Runtime nhẹ để chạy ứng dụng
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .

# Mở cổng 8080 (Cổng mặc định của Render)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "Backend.dll"]