FROM node:lts-alpine3.19

RUN ["mkdir", "/gemini"]

COPY index.js /gemini/
COPY package.json /gemini/

WORKDIR /gemini

ENV RVLT_TOKEN=""
ENV PREFIX=""
ENV USE_PREFIX=true
ENV GEMINI_API_TOKEN=""
ENV TEMPERATURE=""
ENV TOP_K=""
ENV TOP_P=""
ENV MAX_OUTPUT_TOKENS=512

RUN ["npm", "i"]
CMD ["npm", "start"]
