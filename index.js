import { Hono } from 'hono';
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server';
import { Mistral } from '@mistralai/mistralai';


const app = new Hono();
const apiKey = process.env.MISTRAL_API_KEY; // Make sure to set this environment variable
const client = new Mistral({ apiKey: apiKey });
const originUrl = process.env.FRONTEND_URL;

app.use(
  '/*',
  cors({
    origin: originUrl,
    allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
  })
)

app.get('/', (c) => {
  console.log(originUrl);
  return c.text('Hello, Hono!');
})

app.get('/generate', async (c) => {
  const query = c.req.query('q');
  const content = `You are a auto suggestion bot of data analysts company
you are the take inputs and give 4 ways to complete that sentence and given nothing else.

for example : 
input "i want "

then your output should be a simple string with any spaces like this: 
[{"id":1,"text":"what are the top-performing products this quarter?"},{"id":2,"text":"what are the key metrics for our latest campaign?"},{"id":3,"text":"what are the trends in customer satisfaction scores?"},{"id":4,"text":"what are the financial projections for next year?"}]

so here is the input: "${query} "`;
  try {
    const response = await client.chat.complete({
      model: 'mistral-small-latest', // Replace with the actual model name
      messages: [{role: 'user', content: content}],
    });

    return c.json({ output: response.choices[0].message.content });
  } catch (error) {
    console.error('Error generating output:', error);
    console.log(error);
    return c.json({ error: 'Failed to generate output' }, 500);
  }
});

serve({
  fetch: app.fetch,
  // port: 3000,
}, (info) => {
  console.log(`Starting the server`);
  // console.log(`Server is running on http://localhost:${info.port}`);
});
