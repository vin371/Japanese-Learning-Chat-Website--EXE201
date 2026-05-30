# Image nhẹ chỉ để chạy sqlcmd init (không start SQL Server).
FROM mcr.microsoft.com/mssql/server:2022-latest

COPY wait-and-init.sh /wait-and-init.sh
RUN chmod +x /wait-and-init.sh

ENTRYPOINT ["/wait-and-init.sh"]
