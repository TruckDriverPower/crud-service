import dotenv from "dotenv"
import { DatabaseService } from "./services/DatabaseService.js"
import express from "express"
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core"
import { ApolloServer } from "apollo-server-express"

import http from "http"

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
app.get("/", async (req, res) => {
  return res.send("service online")
})

const httpServer = http.createServer(app)

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],

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
const port = 3008
await new Promise((resolve) => httpServer.listen({ port }, resolve))
console.log("⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐")
console.log(`🚀 Server ready at ${server.graphqlPath}`)
console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
console.log("⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐")
