import passportGoogle from "passport-google-oauth20";
import UsersModel from "../../api/users/model";
import { createTokens } from "./tools";

const GoogleStrategy = passportGoogle.Strategy;

const googleStrategy = new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_ID!,
        clientSecret: process.env.GOOGLE_SECRET!,
        callbackURL: `${process.env.API_URL}/users/googleRedirect`,
    },
    async (_, __, profile, passportNext) => {
        try {
            const { email, name, sub } = profile._json;

            const user = await UsersModel.findOne({ email });
            if (user) {

                const { accessToken } = await createTokens(user);

                passportNext(null, { accessToken });
            } else {
                const newUser = new UsersModel({
                    username: name,
                    email,
                    googleId: sub,
                });

                const createdUser = await newUser.save();

                const { accessToken } = await createTokens(createdUser);

                passportNext(null, { accessToken });
            }
        } catch (error) {
            passportNext(error as string);
        }
    }
);

export default googleStrategy;