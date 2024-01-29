import { TwitterApi } from 'twitter-api-v2';
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import * as firebaseAdmin from 'firebase-admin';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Initialize firebase admin app
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert({
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
      projectId: process.env.FIREBASE_PROJECT_ID,
    }),
  });

  
//Initialize Twitter
const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_CONSUMER_KEY as string,
    appSecret: process.env.TWITTER_CONSUMER_SECRET as string,
    accessToken: process.env.TWITTER_ACCESS_TOKEN as string,
    accessSecret: process.env.TWITTER_ACCESS_SECRET as string,
})

app.post("/tweet", async(req: Request, res: Response) => {

    const metaphorsColletionRef = firebaseAdmin.firestore().collection('metaphors');

    const querySnapshot = await metaphorsColletionRef
      .where('retrieved', '==', false)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
        const document = querySnapshot.docs[0].data() as DocumentData;
        await twitterClient.v2.tweet(`${document.title}\r\n\r\n${document.description}`);
        await querySnapshot.docs[0].ref.update({ retrieved: true });
        res.send("Tweet successfull")
    } else {
        res.send("No new metaphor to tweet")
    }
});
  
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});



interface DocumentData {
    title: string;
    description: string;
    retrieved: boolean;
    // Add other fields as needed
}