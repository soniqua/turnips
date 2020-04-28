FROM httpd:alpine
WORKDIR /usr/local/apache2/htdocs
COPY . .
RUN sed -i 's/#LoadModule rewrite_module/LoadModule rewrite_module/g'  /usr/local/apache2/conf/httpd.conf
#Remove error "Could not reliably determine the server's fully qualified domain name"
RUN echo "ServerName localhost" >> /usr/local/apache2/conf/httpd.conf
#Ensure htaccess files are allowed
RUN sed -i '/htdocs">/,/<\Directory>/ s/AllowOverride None/AllowOverride All/' /usr/local/apache2/conf/httpd.conf
EXPOSE 80
