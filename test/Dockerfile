FROM osm3s-server

RUN apk add php

COPY data.osm.bz2 /overpass/
RUN /overpass/bin/init_osm3s.sh /overpass/data.osm.bz2 /overpass/db /overpass --meta

ENV PATH="${PATH}:/overpass/bin"
ENV OVERPASS_DB_DIR="/overpass/db"

COPY query.php /overpass/
WORKDIR /overpass/bin

ENTRYPOINT [ "/bin/sh", "-c" ]
EXPOSE 80/tcp
CMD ["php -S 0.0.0.0:80 /overpass/query.php"]
