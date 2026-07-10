using Microsoft.Xrm.Sdk;
using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Text;

namespace HRAgentSidecar.TokenBroker
{
    /// <summary>
    /// Exchanges the Direct Line secret held in the step's Secure Configuration
    /// for a short-lived token scoped to one unguessable Direct Line user.
    /// </summary>
    public sealed class DirectLineTokenBroker : PluginBase
    {
        internal const string MessageName = "maftagsc_GetDirectLineToken";

        private const string TokenEndpoint =
            "https://directline.botframework.com/v3/directline/tokens/generate";

        private readonly string directLineSecret;

        public DirectLineTokenBroker(string unsecureConfiguration, string secureConfiguration)
            : base(typeof(DirectLineTokenBroker))
        {
            directLineSecret = string.IsNullOrWhiteSpace(secureConfiguration)
                ? null
                : secureConfiguration.Trim();
        }

        protected override void ExecuteDataversePlugin(ILocalPluginContext localPluginContext)
        {
            if (localPluginContext == null)
            {
                throw new ArgumentNullException(nameof(localPluginContext));
            }

            IPluginExecutionContext context = localPluginContext.PluginExecutionContext;

            if (!string.Equals(context.MessageName, MessageName, StringComparison.Ordinal) ||
                context.Stage != 40 ||
                context.Mode != 0)
            {
                throw new InvalidPluginExecutionException(
                    "The Direct Line token broker must run synchronously in PostOperation for its Custom API.");
            }

            if (string.IsNullOrWhiteSpace(directLineSecret))
            {
                throw new InvalidPluginExecutionException(
                    "The HR Management App Guide channel is not configured. Contact an administrator.");
            }

            string userId = "dl_" + Guid.NewGuid().ToString("N");
            DirectLineTokenResponse tokenResponse = GenerateToken(userId);

            if (tokenResponse == null ||
                string.IsNullOrWhiteSpace(tokenResponse.Token) ||
                tokenResponse.ExpiresIn <= 0)
            {
                throw new InvalidPluginExecutionException(
                    "The HR Management App Guide channel returned an invalid token response.");
            }

            context.OutputParameters["Token"] = tokenResponse.Token;
            context.OutputParameters["ExpiresIn"] = tokenResponse.ExpiresIn;
            context.OutputParameters["UserId"] = userId;

            // Intentionally do not trace the secret, request body, token, user ID, or response body.
            localPluginContext.Trace("A short-lived Direct Line token was issued successfully.");
        }

        private DirectLineTokenResponse GenerateToken(string userId)
        {
            string requestJson = Serialize(new DirectLineTokenRequest
            {
                User = new DirectLineUser { Id = userId }
            });

            try
            {
                using (var client = new HttpClient())
                using (var request = new HttpRequestMessage(HttpMethod.Post, TokenEndpoint))
                {
                    client.Timeout = TimeSpan.FromSeconds(15);
                    client.DefaultRequestHeaders.ConnectionClose = true;

                    request.Headers.Authorization =
                        new AuthenticationHeaderValue("Bearer", directLineSecret);
                    request.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

                    using (HttpResponseMessage response =
                        client.SendAsync(request).GetAwaiter().GetResult())
                    {
                        if (!response.IsSuccessStatusCode)
                        {
                            throw new InvalidPluginExecutionException(
                                "The HR Management App Guide channel rejected the token request.");
                        }

                        string responseJson = response.Content
                            .ReadAsStringAsync()
                            .GetAwaiter()
                            .GetResult();

                        return Deserialize<DirectLineTokenResponse>(responseJson);
                    }
                }
            }
            catch (InvalidPluginExecutionException)
            {
                throw;
            }
            catch (Exception exception)
            {
                throw new InvalidPluginExecutionException(
                    "The HR Management App Guide channel is temporarily unavailable.",
                    exception);
            }
        }

        private static string Serialize<T>(T value)
        {
            var serializer = new DataContractJsonSerializer(typeof(T));

            using (var stream = new MemoryStream())
            {
                serializer.WriteObject(stream, value);
                return Encoding.UTF8.GetString(stream.ToArray());
            }
        }

        private static T Deserialize<T>(string json)
        {
            var serializer = new DataContractJsonSerializer(typeof(T));

            using (var stream = new MemoryStream(Encoding.UTF8.GetBytes(json)))
            {
                return (T)serializer.ReadObject(stream);
            }
        }

        [DataContract]
        private sealed class DirectLineTokenRequest
        {
            [DataMember(Name = "user")]
            public DirectLineUser User { get; set; }
        }

        [DataContract]
        private sealed class DirectLineUser
        {
            [DataMember(Name = "id")]
            public string Id { get; set; }
        }

        [DataContract]
        private sealed class DirectLineTokenResponse
        {
            [DataMember(Name = "token")]
            public string Token { get; set; }

            [DataMember(Name = "expires_in")]
            public int ExpiresIn { get; set; }
        }
    }
}