const tiktokClientKey = "sbaw8lr00nutwe3ayj";
const tiktokClientSecret = "WBpuaSh06S2z5Hxs9n0keXzE9eB81wPo";

let tiktokAuthToken;

const setTiktokAuthToken = async () =>
{
    try 
    {
        const response = await fetch
        (
            "https://open.tiktokapis.com/v2/oauth/token/", 
            {
                method: "POST",
                body: new URLSearchParams
                ({
                    "client_key": tiktokClientKey,
                    "client_secret": tiktokClientSecret,
                    "grant_type": "client_credentials"
                })
            }
        );
        const responseJSON = await response.json();
        tiktokAuthToken = responseJSON.access_token;
        console.log(tiktokAuthToken);
    }
    catch (err) 
    {
        console.error(err);
    }
}

setTiktokAuthToken();