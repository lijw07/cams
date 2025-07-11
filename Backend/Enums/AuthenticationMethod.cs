namespace cams.Backend.Enums
{
    public enum AuthenticationMethod
    {
        None = 0,
        BasicAuth = 1,
        ApiKey = 2,
        OAuth2 = 3,
        JWT = 4,
        AWS_IAM = 5,
        Azure_AD = 6,
        Google_OAuth = 7,
        Certificate = 8
    }
}