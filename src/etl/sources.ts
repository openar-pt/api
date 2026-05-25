function encode(internalUrl: string): string {
  const b64 = Buffer.from(internalUrl).toString("base64");
  return Buffer.from(b64).toString("hex");
}

function arnetUrl(folder: string, legFolder: string, filename: string): string {
  const internal = `http://arnet/opendata/DadosAbertos/${folder}/${legFolder}/${filename}`;
  return `https://app.parlamento.pt/webutils/docs/doc.txt?path=${encode(internal)}&fich=${filename}&Inline=true`;
}

const ROMAN: Record<string, string> = {
  Constituinte: "Constituinte",
  II: "II", III: "III", IV: "IV", V: "V", VI: "VI",
  VII: "VII", VIII: "VIII", IX: "IX", X: "X",
  XI: "XI", XII: "XII", XIII: "XIII",
};

const legFolder = (id: string) =>
  id === "Constituinte" ? "Constituinte" : `${id}%20Legislatura`;

const legFile = (id: string) => (id === "Constituinte" ? "Cons" : id);

// ── Informação Base ───────────────────────────────────────────────────────────

export const INFORMACAO_BASE: Record<string, string> = {
  ...Object.fromEntries(
    Object.keys(ROMAN).map((id) => [
      id,
      arnetUrl(
        "Informa%C3%A7%C3%A3o%20Base",
        legFolder(id),
        `InformacaoBase${legFile(id)}_json.txt`
      ),
    ])
  ),
  XIV: "https://app.parlamento.pt/webutils/docs/doc.txt?path=wl%2bCUVeNARn8NII4gzkjnFxECAykhAfVKdWWu%2fQ%2bLsq5I%2fjKgdZlFxk6POdaaIeg2GTjhOCt2cAMVffKZCT%2bs%2bUczi81zND7N6%2fRFOuHMFSgscK%2fZ%2bZet5umJOu6%2bS8W1MK0j3wTmJn%2fjz6PUe5uCYM4ukhvVT7nI0P2Ab4Kl8NWmNPu6coddXkBm2JmvnR1KTFTSHb6b2eGjLEH4r89hoJKaIa8iSUM1Cqr%2fnOwG7K6lrnkqQIIyBhxLgnFQXU1Ag7461cBDgfRbqbl43O2EFWNgq9Litr4EOqxEwpgw86E8jQapZvfRDV4hchQ3VnFD1e%2bK63mS33HrzV9sYHsGz7YvxPq8rVaYuGsMlFmdavSX96opQWtEOe6gVe2J6uRYzMWCG66Yf%2b8TvAaOXV2kw%3d%3d&fich=InformacaoBaseXIV_json.txt&Inline=true",
  XV: "https://app.parlamento.pt/webutils/docs/doc.txt?path=%2fRP9RO9rRG7Rm2x0b54LW2ok9tPweEYB90hne8Wjd7vjX8D7jtU3FOWvke8RG36EYJwz4fhE6CKgw7fC6NYMpNUEt3sFby%2bkJjnsEKK6K1WVmdZiEQDbSvvZZn%2bGThXS2icO46EPuJTta%2bxSZiIe6SWPokoOLzPBb7r4gt6lmRqfqYWseg7SippIjylziooXXpKET7PxF%2bO3naw1MimMO6WckMD%2fWdssGBVqCMPoFuxxQMhxtd7YaNTZSM0NHzFFycQlRkpc1sTaWGUnSivmaYfekteXanFSABHsyraj6TmiYUfkOBBZwvwvSQz9V7UN8iHsI%2fiUmWkC%2fU7fGOn490EUsGaZBrqqOqN1GlNTMbJy2bHO33N2jRRk9rIgJY8lTt39oD4102kaIMIoG18VLsJALZezTU9%2fJdyrbIpCgdE%3d&fich=InformacaoBaseXV_json.txt&Inline=true",
  XVI: "https://app.parlamento.pt/webutils/docs/doc.txt?path=4Sf%2bxPAhVpNaP72V4A4iR827KnpDLDkMYQNE9oZlXc1MZnlNq4dbG7iQtxDaIvcg%2fuJcSweOzCu%2fcnh4%2fW38SKiZpsyKLhixxeW7aqdvPBFAB9TjcIL%2f2xzZ0uhVt5S%2b%2bygk8bFneqEQZCn6afycBtYH6tLqpwfi%2ffntls6d%2fJaoNlGYhP%2bVp38jZKOXyGyyh%2bD7ZD6gr%2fd7HyUvWY692KJAx11fbcLI4jqWAoq0Wv4OT7b1owEhcx0Wyj6%2fmCVtoZ0o6OIjYiHf2KMMN6jR%2b64v5iTlzdnOPydP5QKWBu%2bpAPaKx3RDkHuDMzS0pxsYqDKNt47p8aIAWsLt7riwLQ7IwdOfgpJCmVQUmg1sLJ2%2bLGWaYwC0xujg3RkJuoMf6N0mGpNBcaKp0zooImL4OVK3WbpHvI0LmWQKClmkpmU%3d&fich=InformacaoBaseXVI_json.txt&Inline=true",
  XVII: "https://app.parlamento.pt/webutils/docs/doc.txt?path=5zyAbVC5P5iHxLFX4dvvYn4459K3M9lWQH%2fDcO4IKLXMkN5Hq425yPeRcYFgb%2bc9DlwE0R6cUU5It3LijJBhLPUtaTjLFF9s8dGGHH0M4uqbYAe%2fs5fZg%2fUtcGhKciBr2UtOK4Ni3dUZ7gP9e5liyqHrAZAq7gSTC0sOd09nqPmhcE4irF1LnPUOWEkBTMZ0vShEUbCe7xVRvZrVB92ezvEC1kU%2bR97%2f0dzjL1wDss6Axa1dI2UbSwuzK3uQ3NGl%2feA6BlJaGr3k3zpVIsFoUskWmsgn6ZiIAfMLO1mKE8pmm%2bwMQT7ymW8%2bOSPw51PEFpUPFEU6KqvWL%2bkPKgv9qt4MytM%2fqFtBAbe4DDF%2f3sXzYYGU6GO2UASQhaA2ESwUMofHxV52YK52uXEunzHZZg%3d%3d&fich=InformacaoBaseXVII_json.txt&Inline=true",
};

// ── Iniciativas ───────────────────────────────────────────────────────────────

export const INICIATIVAS: Record<string, string> = {
  ...Object.fromEntries(
    Object.keys(ROMAN)
      .filter((id) => id !== "Constituinte")
      .map((id) => [
        id,
        arnetUrl(
          "Iniciativas",
          legFolder(id),
          `Iniciativas${legFile(id)}_json.txt`
        ),
      ])
  ),
  XIII: "https://app.parlamento.pt/webutils/docs/doc.txt?path=Ypnni2nk15MmdzsLUCNnzk3HqH%2bSpA06jaJQUGUlkHhFkNpwWtAseR2%2fd%2fQVRWbx96r0SNiptcYof4CH34vugxUX3aXWcEprwl0b2vpuWpxxbf%2bqX9W1gVYLF5vAWK12d89MrS4EcnxLGWyLVyQvU4QVTJEIXGqJB6PcKBNgr2aPLMI%2fd8AvgzfJxYz0a9rfWGWoZq7CFsIs9G5UMsCfYJuCXGm5KsA5ndK2M9%2br62dVqYEKj4hvA5iIK0MEIfEW0Gax8s0upE1xOfV080bIvhFmc1o%2bzHbteFNLrJ3apqXpx3nQ5j1f0UmwvIw5NfUC587ZLKtOXDllCzJhbcqbgeHa9el5f2lnLxk0aefDxtI%3d&fich=IniciativasXIII_json.txt&Inline=true",
  XIV: "https://app.parlamento.pt/webutils/docs/doc.txt?path=MRjU53F1NvJNWzaXbrTaBwlRPxSTJfGM23hrjAbamr1%2fGkZByUQKA5KmsNdKx%2f37mLg%2f2Bg3YXydGBLd0NR8D1s7u%2fTjkiqHb%2fMlZvh8HRjiJPXUJsqSyDGWfccdQvIdFdbiW3GLj5%2f3C4%2blTfuiV4dM8DLzSF6r9H6rz3biARbJDOFsijstFhz4v8nn2jiY8ubvqJGnBNeHOGOPeMenz%2bgUlBbAIM4Cx8xTW2rhLuooDcO3beOQPpIG4RXMJdSE2hvyAG8aatvy87kttJVwi72DL3L6HbNH4lbb6nHcSuBwmFcdPF9Ri60XecvhFAk1KMyX7cEBpQXj%2fdk%2fX4%2fr6sdiINnBCO8ddonqxWe1TQQ%3d&fich=IniciativasXIV_json.txt&Inline=true",
  XV: "https://app.parlamento.pt/webutils/docs/doc.txt?path=Q9pMXr%2bqmsb6iUuOjta9OFE7aYcC8azZAkR6W%2b02QwrKJNaPcHmZdjTTcRlbVxB9Mh91Mj0fVKExPiqZdvwU6BQRNlWwvsde%2bl0ZCIE6suWvw8i7cfYmRF4bOXl9qGdTzxAF2EBjAGBj29G86CW%2feYOHacU6CWLTdQOjXnXM1AWHxrkcDHNCLG16jt8tGKnJ7XFSF3yDmLlzs8qJZOJHHrRsUhgegcYnTlQANJetzeF3iXdPG0gXyHoZba0CL%2faQIlmBWYkzidqBifcY3HjCuJtByK0y1CTbUIkD68c2NiUrwvTLbp7mht5IWPtSKX4UFypRjT9xDURYk397798qmY6gWNvrLN20AGCAniw6fJwAklrpWnx0ct9XN%2bHXeDOU&fich=IniciativasXV_json.txt&Inline=true",
  XVI: "https://app.parlamento.pt/webutils/docs/doc.txt?path=IIDQnqbDLG0A0muO1xMUgrs%2fPw6vFjR%2bW97rDQOmkvZbeKW4ZQ%2fM6wYlQCDss0%2f4%2fvXPNLBeth1oEAXy2vD2RcNhc%2bodqFDeNF%2fXBt5kdVV9v1nhDUmdUGhJCErURltdyfMszVP6fAeur32lcwl5B48p6J5Hr6MxxstVrDuntnOG0sXqhdg9E7I9tkxORKo%2fHwmWTPhn6kf7kwU%2bvvdnY40YolLKyFouuZG8CH0TFuwTHeT8rarQ%2bVH7Gx2AdAcqHa0NOWQqBsmHcWUuccR0yWOAKZar%2bOXJ77QPFMatmlHa2v3NpbCPhtwyLWNG6LVGRukBq5VW6fUw63DDIqi6QiwtQBHtyQfvnbI91xbVOk8%3d&fich=IniciativasXVI_json.txt&Inline=true",
  XVII: arnetUrl("Iniciativas", legFolder("XVII"), "IniciativasXVII_json.txt"),
};

// ── Atividade dos Deputados ───────────────────────────────────────────────────

export const ATIVIDADE_DEPUTADO: Record<string, string> = {
  "Constituinte": "https://app.parlamento.pt/webutils/docs/doc.txt?path=Smd98U7EDEJlcMkip%2fhu5RXV%2fIocJMFGa7Z1dorWRObOaV8620Y4Wmlu0QFfH1wmgGJK2HtnftFLU2tCx3%2bbEg%2fjwttNjSfhJG7BoG19OkaCPylY2JDk5C2%2bf8TemjjXYav9pku0uxqX%2bmRoVsv6KJbxS25F%2fnZIUZLOPKo5hKH%2bHVNH8j85PeRUIBAfE6E0eBfNYc4W3P5AiVeJQ6Pej%2bfLkwQvYaTAML2mhO58QGvn6KGzCyjh8Ne14W0G2Rk5nCzB3As%2fy7WRTz1%2fId2hwDOVn2JHWQ6D6DXr9c91qgF%2bWmqhHWKGg%2fYcD9ERMoxi5tuXbWfofoCHkjhBRYTkZoXqtbA3WKIZ9s1aufHjZuP6sJLpjqLYeshjKg5%2blikyqOFDttSOkR8MJJZ8Sja3Mg%3d%3d&fich=AtividadeDeputadoCons_json.txt&Inline=true",
  "I":   "https://app.parlamento.pt/webutils/docs/doc.txt?path=pTO8WeFzcyamaZ5dAFa0EPJ%2fbQN6LWmCFnMT51eZtGutvlnsyCsgiRq1I77YCh1AtJ4UO0TIuzeRS%2fMx87hvEMNwZ2k9d362WSQ%2fcn64lXQvJ8navcMc7jK1U%2bVnpLoF9E2lEIys6sJqmCyWPVEwG2skNlmj09lTK9BD7JsKvrtEIEL1LAdFENcRT89q2rbsatAOZVhh7v3CDROZmEnqPpR%2fqPft6OAEmn%2b%2fMZbH%2bw6q8%2bOCUihi2lwxRQvp9v66TejfHM1T6WMtrgEGK4uqoKLRpIs4PaWfndbaAUWUh3FutFNyG0ZcMtxVTmekXNf1XXLhgMkVL6Vuf4f9ASyg9LTgEwcowzXLnr4vnHA0ogJn7IDlEtDQaYMLRCGrAOSkgRDwue%2be3Mj3wnnhV0E0QA%3d%3d&fich=AtividadeDeputadoI_json.txt&Inline=true",
  "II":  "https://app.parlamento.pt/webutils/docs/doc.txt?path=hllQEHKcHwmoyC%2f6HRG7r4PbKIXH6kF%2bKAKRzVis0G3J9qQJJ9MWy02HLaSZUaQ2EFwRkXDAsGdGarru2nL4IHkqlKZgfvnjVDCdwbX4emU3MTIiF1jVgPcdQLrR65imBY6O3TGIX82hcJStwT%2fPWsYB84oMGzYvxC6YGBP8OFS0EZpbWmlPvP3ZfgqXaR9zU%2fouLiJWObbW2GaozajS7zNleVV%2fAj0v4esTe8K%2bQ1x6c6RqH1GSLS3P9dg7rX4UOqUYs5cnlGPq2UorHQhJ6GNEnPtGVszs7L01%2fdBK5Dni%2bR4losIvz6FOm5b%2f3M8D7oU8eIDLBPZNXjteqgjM0ZzpPOIY7igaEFAU4Sg7SdkkULWeB4EdUPblSsYDCuaN30wXhWPI93mIHyuZLBQqzw%3d%3d&fich=AtividadeDeputadoII_json.txt&Inline=true",
  "III": "https://app.parlamento.pt/webutils/docs/doc.txt?path=7ydwxQZxmJip6KzAwcI4fE96QrHbUy%2bR2ogUCs9DmlKJFGQna1l9OaGBMRbL2qa5Qug82PmkBk5hSeKNYVZ%2b3SveeH2qU1BGRAFho3zMpFESkGhveHJLPlmNcuWI7f%2bZpRV2meosj0nmahdyh8HENyInja326Xx1PxbjdAmyaGkoCTEcD5G7Xbk3Rx73wacOuAyymBbx1s3xx%2bk3HDOI8t1p2j9CeSXrWUKBc0feFwmiFsgQomyrHwGtv8HkjBIpK8uPsBSne7s9mB7pXwqxKETRYRNwnEd0sI8xAReu5mFWyXScb54J6LS1ZQxW0xm7MXfl3NLLw121XgdMkqX0nmjhpZt%2b8Uz%2fvedIR7fKsZAsvLXSNZW9CMFyFPVxbBV6tgU1o%2bRlqB0UTVSAEWcgeg%3d%3d&fich=AtividadeDeputadoIII_json.txt&Inline=true",
  "IV":  "https://app.parlamento.pt/webutils/docs/doc.txt?path=j2Hyt1R1PO9N4ACcJsBujJlbkTZh45VBlc0GvERRZFkr%2fZSjyLFUyH%2fr3wFWls864cVoDtoTEIhp2b7GrepggaBhKpLgOXDeQqBCdQXZwoWCslEri4EfBqPwVMaUFAwohuWcG%2b4aKjmzWZDMQUvBjmLyxIEiPghfnH%2bTD5uViuGtLZ9SVVrteS57v%2ftO4QSxA16LQkqddzpboY3h5Mfzr9eYIkHilJof%2fwKnC3u85KPic6nOFBgdvhXHmcbJMMKTTMugxhcrnyPnMYROAgVF2jwd0%2fVSnVWWov67B9%2fT9gVgSqPEYozLu80E3BOi2ULHGlZiDyV8o72LTE3Hxn5n6flPtEcFklqBmSLxn%2fXUJHTxysR14DZBDdnvT%2f3iTXWq0tBTT7Q08Ks5tbx4XKwJDU74tM69AJlOvSJhQK47AjI%3d&fich=AtividadeDeputadoIV_json.txt&Inline=true",
  "V":   "https://app.parlamento.pt/webutils/docs/doc.txt?path=IOrfq5tElPmfbqCHPe0%2fGPAMboVPtWzbDUoWOttw3G6rk4%2btrD9smwTEGkqWaMqS4ugEX97c46C2SPjzbQyQUQwGAAVfW%2bmJaVmY9aYhQDSl6gj0wOnTk%2btYFBlyhHQNQPKPVw5dSF224%2b020dAhrrl7UvHS8qDmhMEpCHiLLYV3JGlcCXJWaANUJwih3Vw2ATmzo0fEkK%2f28aMs0W9QBiCutdtCrXMDBWuMfS0XeElwxtEQlFBkKhGcUk0mpOM8%2bmLj4VpLKMnNisma6BrNz%2bD%2frIrgOmTUx7pQKYazfM%2fTtPjlQ%2bGrPQ%2bMcm4IlM9yGzUD%2bVJq0nqJoY8zrTESf2pPwMj0NGY70fXQFc9ty%2fSC%2f%2f8AZLOK14WDYK6pdXB%2b&fich=AtividadeDeputadoV_json.txt&Inline=true",
  "VI":  "https://app.parlamento.pt/webutils/docs/doc.txt?path=o4U1cTB9y2UwCwmmk8Vz0C%2biLqc8JQVyCSWYUkOq51ymWInAJHdHTS9QhpaOpyOddseC%2bHwh0NPjJbcMvNjgJI9yiNzl%2bR2jhe3UbgpgX0ERqor3CfpYocVRF%2bT6shky%2bCK0MkSZqAgN7Pos%2bphuoroEakKDLyi2feKgU25o8E%2flzkmifLNaai%2fwCn7sAnGgzrEUKZTD%2fuGt7I3QxX%2bzhpzIJYLxKvP05bpNrYeh%2bQjlbrP2RjewtT2h5odvTwUclTzpDMETNfpKJg81zt2OoCps3RU0QJy4WZ5pm3vl91Hqs8x9gqRv0aps0BTeV%2bhmNV3CV6gpEvuK9QCgrAQeqAknh15E1gq5%2fnp6wgd8ivLW3uarmD8KQlbaIA%2fLyJ926Giz%2btatlE3vcobcePWIipYEbcgM9EL0y9YPehj1SHU%3d&fich=AtividadeDeputadoVI_json.txt&Inline=true",
  "VII": "https://app.parlamento.pt/webutils/docs/doc.txt?path=mXIe9RswS%2fJV5cUfgFld8Fn4MdNS%2f%2fkZCLemlG8%2ftra%2fUnfa6dlgnQHNAZ6PFbgl25lSXNQ0xUot93IrKfVR0jgR5O2Fh7e1ZTFsJr77w7yS%2fiGIYoEziBUAQMx58h0n2i%2fY4pDvQn6A%2fcMEmbkHY9NQWy5pqbm3gTzW4g6cozf8rjj241Ap48VLJks2LtpUQS492OKkYugOHvKN4q4v8jtIUEmrISnRRsaESygbU1YxofYxIT0v%2br2t4FA%2bBuBoYquAEhGs2WtHbfZj%2fA5YB%2fP019SE4fNwY3%2fNA9myEvW%2fNzivszQ5VxTALySYKozNDdkvrYw6rHQ%2f%2bgc9JyWE7YQrlF3OoIc6R3%2fG3lf9iauhHRe0fGTWWbrAJv6hPXAlvNlj7qikutiDnaSCh1baTQ%3d%3d&fich=AtividadeDeputadoVII_json.txt&Inline=true",
  "VIII":"https://app.parlamento.pt/webutils/docs/doc.txt?path=Dyjx9aUq7kUAqiZToE%2buq8ZXAcAiZ9zo0fryXSPs8t7g65BobPY9QUHaAoZ0%2fXsuTFYQDV8T7w7dNtQlcBT4Z30vUwpAcpUZWyySFdlQ6RoDGrGAhkA13gXtclnfe3sJHrl45Tr34ey3y5L59esnmaAmUXlUvrZuX8csGGKJbHsnpI3qYqj22DtKnqlr1UMrXcIJgwDoL2kM0I4E9nwW7EJcPdBXv%2fznGgLr7PON8%2bTnJvUewYL7JzFvj4dv%2brzZjw5E9cuBvMi%2b%2f9%2f0Wrc3VGwj%2b0wHEYzMDN1A6yvdIgfXT7FAvRE6ILscJ%2bNfRauBdYae5iSmtSGu3NISwtu%2bW8eI0eVFL00OylGOLHMIuGrV1Y%2feD9jl4mvFmoJuqMmbePGYAIaxGZTVWqfL5qT%2flt2vmJbJxiITLVtDQ3jdnp0%3d&fich=AtividadeDeputadoVIII_json.txt&Inline=true",
  "IX":  "https://app.parlamento.pt/webutils/docs/doc.txt?path=pYK12a2ZYrk1T8WwW%2bKsWgQuRyvF45mmdvM3dUfHu%2bcAtHVMwGdM3XaBw7iIb5r6rk%2fXfggt%2biPj%2bNax4AE%2fjrjBRx%2fISRdACbc0ylf9nsoiz%2bILftwzHt%2bW7pLNKOQrnhAuAbvcdsVCi2CY%2fYCzDPDjXxAn2MDg1cR3vOCoclC%2bGeXxLsrVoRAGfufcghRD1DCokdU1J6pFlnO82VLCBv%2ff4U%2fOg6CpkZ4hQzpRUqiJ0vkPmJ5sr0zich%2b5u6Lzoox3rfUZQKoQcDtd8qMgZ5JJhlcNL0qbHkfOCrHbmesgPeWTaqbblha7THUA5VdObWw8S0Dka6NoCngVx6%2buy363NIh3lBv0K9KYQn9Bm%2fqJHY7fs6Poj1GijA8ROVoNdzozJR7hQhhaq1KDEHHyvw%3d%3d&fich=AtividadeDeputadoIX_json.txt&Inline=true",
  "X":   "https://app.parlamento.pt/webutils/docs/doc.txt?path=0RfGL4rhCiAt2Twh04s8KFy3kB%2fS8b3N4bgbiwsZ%2f1YhDUT56dNjC4JLmPzbiLXDHfg151mlTjSDZjrfVNcz4ZRNRIgxo%2f1NJ1b7lJFsNCamD1Z%2bO%2bND%2fCrBw4Oohzp5pYBWNaBkJWsDMq%2fjt%2bc5it2vKPKI2FHdQX1VIBi9oGWLn%2b5bfGIOyxa1RfTv6fi19jcJvf33BVHDsJOxqQcW28WmVGYBm2jKy3gqBvIc9tbzsvys6bCLPVVNkSjWee7fMMThxfR9AleTKF96LAk%2but1NUwRmyTuSr%2b6LhNZc%2bXjFdMbmI6UZnowMKe7Hv9avnOX0%2fjmYK%2bbv7Bb8sCFJzmiIKUhdKzeCIkUGeRZLjNMJB10Ifvxu9xJ3fVW7Jvz%2bhIOuClKQO27qmsbQr3H8EQ%3d%3d&fich=AtividadeDeputadoX_json.txt&Inline=true",
  "XI":  "https://app.parlamento.pt/webutils/docs/doc.txt?path=rgwAWocxjYvH%2btH%2fCagOYM872npgXvFyQJENxbyj9qCpJmIvnh5qd83ygIeZ45HS%2bCuNon02NcISeAhZ2L%2bZTLW87DI42ahWRbYq8vQbMDUPeGc7RSzQLtk8SmvVUu8dYGniLyD%2bwD1tK3aFVHGShurVKhyYKEFy4oRF7DAK2bwAWsozWeP%2fXNcS2196c8RKy17GVDNft45hmsZfRlj5YIFVYRaGBufegNPsvXtT5MOKdeCaI4%2bSfw4kdoW4ue9x1v55YNMTV%2bGPqtlRG5hN5v0qj2Xy96b8Yni1ZgR8KULpNmPVXqmOLXNur3Pdj6k3LA%2f7bJ6h%2fhxsLsQyJKMY64Zg0fi2clOd1jWAZHHdrLAvix3Nnlrp3dpa3hcAZ9cNmc0sASN56v2GSOoDBNrxeg%3d%3d&fich=AtividadeDeputadoXI_json.txt&Inline=true",
  "XII": "https://app.parlamento.pt/webutils/docs/doc.txt?path=PFuDtVUkGS6cnNr3DfFfjjJ5zgV8et9ytmpuugRHAU2fz%2bHSu%2fLjktHNGh8F7YOwP2MR3bMPI4krDPxnVEHiKqwaI%2bl9cx80JAsHvxzc%2bZ0HKn4J%2fy3f42KSDHJLkAG8fK7rjU%2fUCNnYzPIoxHJKi7H%2bZj4mqZnozvPFBSV1Jb%2bD7Lig5NQN3BhJ0pIK0q9lBkI%2fgtt405ong4CK2X8mqucMtV2v1jsBKx6xGZDj%2b%2bclU9C5nC6ZIvRF8O5IuliV1ia%2fPQ4e0dHQCxtuDus%2fVCnZZ6hH8o4MB6kqWj6EzsZ%2bT9h76t%2f2exspkWiyWm88U7lL1lKhlFlvFGZUeaXeuZvNJuz3o%2bA3nbr%2fP33QQD1I4fjvsyoETRDhvNlI8ohS&fich=AtividadeDeputadoXII_json.txt&Inline=true",
  "XIII":"https://app.parlamento.pt/webutils/docs/doc.txt?path=SaAJYek%2fL91aPsSMNknKJVXRbwK2KnLLQbO%2b7EwGxYOobKLgoIDlPT8sdhsf%2fzO7jHEsZoHXP%2b%2b6dkYDCeEOgPJwe0RqTHtJiMRQXJogAHHfDrT%2bRZflOE2CawgHN%2bIplJ37fBOpaiyzAhfybb1gmfVH5mc6UGNSgDRSYbZZCIIieJ0p4xAc5ekxDnEg53TDMy8%2f8e%2fw94s1%2b9m%2bc3OVph3PXI8tm1Hcsok90kfPhCd4arRxPjZP40Rw90N6NI9j4SEAu%2fMWcgVU5RaV8OI7NqEWk%2bERRI%2fNF6PIK9kqkqKioz%2fLyIxeC9zM2%2fHa5iV6lHi4XqaY8%2b%2fthD%2buHIHTqvXMLbS7LAL8UQi7EpsRuUkjB%2bf8ddJ5GwXMa7QAQgCfgfi849Vm%2feWibpKdpmhkcpRvf6vBvWtPX1%2fyMx1re8wrzaYhDKeaovoPKdWL%2bR24&fich=AtividadeDeputadoXIII_json.txt&Inline=true",
  "XIV": "https://app.parlamento.pt/webutils/docs/doc.txt?path=70DU2oLWlcbh5xcl4wBrEHFzb31x1tNC0bQ6fxW8Hw2qbqzEGFqez72K0TEpFg8s%2bWagILaYxrZyjX8QiP2vXkv%2f3abRhPD7D8kCVdPQ5T%2fm%2fcV6gmZHtDcWh8cBM3LW3bDiQqZRzIXQzadRKEFAG6ZXCh%2bFISyMQVJzkUFdwZXrlpSIAZtxn4O2Tz0hdRebjz3bownAJ09o4%2fuNxpX%2f0PZ%2f06jwX4A0xeBqyPeFN6tn%2f%2bXKOc9YtLorVZJjWTC2PwNwAiMBrigh6qIo5VXeEdAClPcceMQuFB3tRmAxQQMCie4PrS5YmYGafJWRILo3C7Cq0Aw6Y6Yn1%2fCE5c54P3rtNsPVtCtBGqLJ50YuRlBVC1qoqEAm75oMR6YBlyG3&fich=AtividadeDeputadoXIV_json.txt&Inline=true",
  "XV":  "https://app.parlamento.pt/webutils/docs/doc.txt?path=4ap35kHslHvrk6aDoy0FzLMj7%2fdwOixyhp0wlC7X2dRd5KrBl1QC5o8HOZhve%2biyx1r00MYvTaWBfrbRc6%2fNz62kCyfnlgeQa8mdILti6WIp%2bI%2f0mxRBNHAfDObEA1XFjFQgHiiPZVThZ7U6Y042Tz5YztIGqMVaPn90A26OzJmQelkOoU5YrL5%2bHtRVB5x70PQTxTL6yze7ARAcCp7zIGbbZmstGciNbqHNbntgp8EiEV9X4c2q99ptFAG%2bgxwPWq2SuHwWf86ixE3vawDqc2XaYZi5q4JIp5UAd49UQRrvCksi3Djw%2fMc3EsxCcASH9RYjL3Kk6zECNjgSlC69rQG5lQCJqedriaCwtEQISnpffe0HQeHxE9DhPwAO9nqEss7oLcg8w%2fQ5krrEyCDSpQ%3d%3d&fich=AtividadeDeputadoXV_json.txt&Inline=true",
  "XVI": "https://app.parlamento.pt/webutils/docs/doc.txt?path=W9ki4D6mqVsN6crqbM5rDA53ZS9PLHZgYXmMBdf9cSesshlGMsSiFi%2fUbM7fNKXu9Mo9rudkVnT%2frQvLrZlKyjFA72%2fU9ltn6d%2bzddp2UXITRxcpTI27TeL%2bLFUvz%2fdq90t1BlMHtFzgjhJcupRCG1wGO0tbGzh%2bKMDHNLfFszdQZCaPRx52W7DWbe0WvMaIBpSRqGuUgItn5LMvPyXn8Xu4y2kE26nqefsjpvUmP8eAqxlpsXXdPlBhXJSIitWxxUOpYZjNyJDFgP4K0hiWQ%2fdx8MywwN1cUTD9sYuucMnHvg3QfG7crpTpv2rPPEnrtMpVArs7FRhPhTPQps5%2byEYUo6n9MErIHKYuQFZHm0ELH3JrrVjhVQCLHWRLDC5jsYPIDk01N2sfaGWhBcrapg%3d%3d&fich=AtividadeDeputadoXVI_json.txt&Inline=true",
  "XVII": arnetUrl("Atividade%20dos%20Deputados", legFolder("XVII"), `AtividadeDeputado${legFile("XVII")}_json.txt`),
};

// ── Petições ──────────────────────────────────────────────────────────────────
// Available VI–XVII

export const PETICOES: Record<string, string> = Object.fromEntries(
  ["VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII"].map((id) => [
    id,
    arnetUrl(
      "Peti%C3%A7%C3%B5es",
      legFolder(id),
      `Peticoes${legFile(id)}_json.txt`
    ),
  ])
);

// ── Registo Biográfico ────────────────────────────────────────────────────────
// Global registry — same data regardless of legislature, fetch once from XVII

export const REGISTO_BIOGRAFICO = arnetUrl(
  "Registo%20Biogr%C3%A1fico",
  legFolder("XVII"),
  "RegistoBiograficoXVII_json.txt"
);

export const CURRENT_LEGISLATURA = "XVII";

export const LEGISLATURAS_METADATA = [
  { id: "Constituinte", nome: "Assembleia Constituinte", dataInicio: "1975-04-25", dataFim: "1976-07-23" },
  { id: "I",    nome: "I Legislatura",    dataInicio: "1976-07-23", dataFim: "1980-06-02" },
  { id: "II",   nome: "II Legislatura",   dataInicio: "1980-06-02", dataFim: "1983-06-09" },
  { id: "III",  nome: "III Legislatura",  dataInicio: "1983-06-09", dataFim: "1985-11-06" },
  { id: "IV",   nome: "IV Legislatura",   dataInicio: "1985-11-06", dataFim: "1987-08-19" },
  { id: "V",    nome: "V Legislatura",    dataInicio: "1987-08-19", dataFim: "1991-10-06" },
  { id: "VI",   nome: "VI Legislatura",   dataInicio: "1991-10-06", dataFim: "1995-10-01" },
  { id: "VII",  nome: "VII Legislatura",  dataInicio: "1995-10-01", dataFim: "1999-10-10" },
  { id: "VIII", nome: "VIII Legislatura", dataInicio: "1999-10-10", dataFim: "2002-04-17" },
  { id: "IX",   nome: "IX Legislatura",   dataInicio: "2002-04-17", dataFim: "2005-03-09" },
  { id: "X",    nome: "X Legislatura",    dataInicio: "2005-03-09", dataFim: "2009-10-26" },
  { id: "XI",   nome: "XI Legislatura",   dataInicio: "2009-10-26", dataFim: "2011-06-20" },
  { id: "XII",  nome: "XII Legislatura",  dataInicio: "2011-06-20", dataFim: "2015-10-23" },
  { id: "XIII", nome: "XIII Legislatura", dataInicio: "2015-10-23", dataFim: "2019-10-24" },
  { id: "XIV",  nome: "XIV Legislatura",  dataInicio: "2019-10-24", dataFim: "2022-03-30" },
  { id: "XV",   nome: "XV Legislatura",   dataInicio: "2022-03-30", dataFim: "2024-03-10" },
  { id: "XVI",  nome: "XVI Legislatura",  dataInicio: "2024-03-10", dataFim: "2025-06-03" },
  { id: "XVII", nome: "XVII Legislatura", dataInicio: "2025-06-03", dataFim: null },
] as const;
