import { Strategy as FacebookStrategy } from "passport-facebook";
import UsersModel from "../../api/users/model";
import { createTokens } from "./tools";

const facebookStrategy = new FacebookStrategy(
    {
        clientID: process.env.FACEBOOK_ID!,
        clientSecret: process.env.FACEBOOK_SECRET!,
        callbackURL: `${process.env.API_URL}/users/facebookRedirect`,
        authType: 'reauthenticate',
        profileFields: ['id', 'displayName', 'emails']
    },
    async (_, __, profile, passportNext) => {
        try {
            const { name, id, email } = profile._json;
            console.log("PROFILE:", profile);

            const user = await UsersModel.findOne({ email });

            if (user) {
                const { accessToken } = await createTokens(user);

                passportNext(null, { accessToken });
            } else {
                const newUser = new UsersModel({
                    username: name,
                    facebookId: id,
                    email
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

export default facebookStrategy;
