import dotenv from "dotenv"
import { DatabaseService } from "./services/DatabaseService.js"
import express from "express"
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core"
import { ApolloServer } from "apollo-server-express"
import cors from "cors"
import http from "http"
import _ from "lodash"
import { ModelService } from "./services/ModelService.js"
import { GraphService } from "./services/GraphService.js"
import { graphqlHTTP } from "express-graphql"
import { buildSchema } from "graphql"
import mongoose from "mongoose"
dotenv.config()
await DatabaseService.connect()
// Construct a schema, using GraphQL schema language

await ModelService.setModelSchema()
await ModelService.setModels()
const typeDefs = await GraphService.getTypeDefinitions()
const resolvers = await GraphService.getResolvers()

var app = express()
app.use(cors())

app.get("/", async (req, res) => {
  return res.send("service online")
})

app.get("/working", async (req, res) => {
  const record = await ModelService.getModelSchema()
  console.log(record["ChatMessage"].fields.created_at)

  return res.send("service online")
})

const httpServer = http.createServer(app)

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  context: async ({ req }) => {
    /*
     * If introspection, check for introspection key
     */

    const isIntrospection =
      req.body.operationName === "IntrospectionQuery" || req.body.operationName === "ModelIntrospection" || req.body.operationName === "RequestAuthCode" || req.body.operationName === "ConfirmAuthCode"

    if (isIntrospection) {
      const introspectionToken = req.headers.introspection || ""
      if (!introspectionToken || introspectionToken !== process.env.ACCESS_KEY) throw new Error("invalid request")
      else return {}
    }

    /*
     * If normal Query - set user context/authorization
     * Example Token: "5e97225de5026673cb3a11e6:TFX9bcmDgWtvpb4mstLJ"
     */
    const token = req.headers.authorization || ""
    // if (!token) throw new Error("invalid")

    // const tokenSplits = split(token, ":")
    // const userId = tokenSplits[0]
    const session = await ModelService.findOne({ model: "Session", args: { access_token: token } })
    if (!session || !_.get(session, "active") || _.get(session, "access_token") !== token) throw new Error("invalid session")

    const user = await ModelService.findOne({ model: "User", args: { id: session.user_id } })
    // console.log(user)
    // console.log(token)
    // console.log(session)
    // console.log(user.customer_success_app_enabled)
    // if (!user.customer_success_app_enabled) throw new Error("invalid permissions")
    // throw new Error("invalid key")
    // if (!isIntrospection) console.log(req)
    return {}
  },
  formatError: (err) => {
    console.log(err)
    // Don't give the specific errors to the client.
    if (err.message.startsWith("Database Error: ")) {
      return new Error("Internal server error")
    }
    // Otherwise return the original error. The error can also
    // be manipulated in other ways, as long as it's returned.
    return err
  },
})
await server.start()
server.applyMiddleware({ app })
const port = process.env.PORT || 3008
await new Promise((resolve) => httpServer.listen({ port }, resolve))
console.log("⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐")
console.log(`🚀 Server ready at ${server.graphqlPath}`)
console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
console.log("⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐")
