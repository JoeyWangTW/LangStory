# LangStory
LangStory generate fun and customized stories for children based on any LangFlow apps. Using their favorite characters to teach them the core concepts and components of AI applications. 

## How to use 

### Story generator
1. Install and run [LangFlow](https://github.com/langflow-ai/langflow)
2. Open a new project, and import [story generator](https://github.com/JoeyWangTW/LangStory/blob/main/LangFlow/LangStory-story_generator.json)
3. Input the app you want to turn into a story, and add preference 
4. Run the app, save output to a json file

### Story Teller
1. Edit [app/InteractiveAudiobook.tsx](hhttps://github.com/JoeyWangTW/LangStory/blob/main/app/InteractiveAudiobook.tsx) to set up the [AI/ML API](https://aimlapi.com/) for image generation
2. Run server locally

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.
4. Upload json generated from story generator
5. Wait for it to generate, you got your story!



