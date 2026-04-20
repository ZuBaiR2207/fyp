

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

#  Accept build args
ARG VITE_AUTH_URL
ARG VITE_SUPERVISION_URL
ARG VITE_NOTIFICATION_URL
ARG VITE_REPORTING_URL
ARG VITE_INTEGRATION_URL

#  Set as env vars during build
ENV VITE_AUTH_URL=$VITE_AUTH_URL
ENV VITE_SUPERVISION_URL=$VITE_SUPERVISION_URL
ENV VITE_NOTIFICATION_URL=$VITE_NOTIFICATION_URL
ENV VITE_REPORTING_URL=$VITE_REPORTING_URL
ENV VITE_INTEGRATION_URL=$VITE_INTEGRATION_URL


RUN npm run build


FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
