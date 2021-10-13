import dotenv from "dotenv"
import { DatabaseService } from "./services/DatabaseService.js"
import express from "express"
import { ApolloServer, gql } from "apollo-server"

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

// var app = express()
const server = new ApolloServer({
  typeDefs,
  resolvers,
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

// The `listen` method launches a web server.
server.listen(3008).then(({ url }) => {
  console.log("⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐")
  console.log(`🚀  Server ready at ${url}`)
  console.log("⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐")
})

// app.use("/graphql", graphqlHTTP({ schema: schema, rootValue: root, graphiql: true }))

// app.listen(3008)
