
---
## Requisitos Previos

Asegúrate de tener instalado [AWS CLI](https://aws.amazon.com/cli/), [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html), [Node.js](https://nodejs.org/), [Yarn](https://yarnpkg.com/) y [Docker Desktop](https://docs.docker.com/desktop/install/mac-install/) en tu sistema.

## Configuración del Proyecto

- **Accede al Directorio del Proyecto**

- **Instala las Dependencias:**
  `yarn install`

- **Iniciar lambda en modo desarrollo:**

1. `cd chatbot/infrastructure`
2. `yarn run build:prod-Chatbot-Assistance`
3. `sam local start-api -t aws.template`
4. `Ejecutar el request en postman: http://127.0.0.1:3000/assistance [POST]`
5. `Ejecutar el request en postman: http://127.0.0.1:3000/avatar [POST]` {
   "voiceText": "Este es un avatar de pruebas",
   "backgroundPreference": {
   "type": "color",
   "value": "#008000"
   },
   "imageBase64": ""
   }
