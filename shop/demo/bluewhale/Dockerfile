# Public demo of the shop personalised for "Blue Whale Gems" (build context: shop/).
FROM php:8.3-cli-alpine
RUN apk add --no-cache libpng libjpeg-turbo libwebp freetype \
 && apk add --no-cache --virtual .build libpng-dev libjpeg-turbo-dev libwebp-dev freetype-dev \
 && docker-php-ext-configure gd --with-jpeg --with-webp --with-freetype \
 && docker-php-ext-install -j"$(nproc)" gd \
 && apk del .build
WORKDIR /app
COPY . /app
RUN mkdir -p assets/bwg && cp demo/bluewhale/assets/*.svg assets/bwg/ \
 && rm -f storage/config.php storage/shop.sqlite \
 && chown -R www-data:www-data storage uploads
USER www-data
ENV PORT=10000
EXPOSE 10000
CMD ["sh", "demo/bluewhale/start.sh"]
