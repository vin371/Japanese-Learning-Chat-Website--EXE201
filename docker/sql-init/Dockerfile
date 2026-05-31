# Image nhẹ chỉ để chạy psql init (không start PostgreSQL).
FROM postgres:16-alpine

RUN apk add --no-cache bash

COPY wait-and-init.sh /wait-and-init.sh
RUN chmod +x /wait-and-init.sh

ENTRYPOINT ["/wait-and-init.sh"]
