
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client('49790761791-ifon1ncmkvil2u5umq1mvsie2hu6p16i.apps.googleusercontent.com');

export const verifyGoogleToken = async (token) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: 49790761791-ifon1ncmkvil2u5umq1mvsie2hu6p16i.apps.googleusercontent.com,
    });
    return { payload: ticket.getPayload() };
  } catch (error) {
    return { error: "Invalid user detected. Please try again" };
  }
};
