export interface FranceConnectProfile {
  birthcountry: string;
  birthdate: string;
  birthplace: string;
  email: string;
  family_name: string;
  gender: string;
  given_name: string;
  login: string;
  password: string;
  phone_number: string;
  preferred_username: string;
  sub: string;
}

export const TEST_USERS: FranceConnectProfile[] = [
  {
    sub: "aef0c0a3b5c4d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1v",
    login: "test",
    password: "123",
    given_name: "Angela Claire Louise",
    family_name: "DUBOIS",
    preferred_username: "",
    gender: "female",
    email: "wossewodda-3728@yopmail.com",
    phone_number: "123456789",
    birthdate: "1962-08-24",
    birthplace: "75107",
    birthcountry: "99100",
  },
  {
    sub: "b1f2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2v",
    login: "avec_nom_dusage",
    password: "123",
    given_name: "Pierre",
    family_name: "MERCIER",
    preferred_username: "DUBOIS",
    gender: "male",
    email: "ymmyffarapp-1777@yopmail.com",
    phone_number: "623456789",
    birthdate: "1969-03-17",
    birthplace: "95277",
    birthcountry: "99100",
  },
  {
    sub: "c2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3v",
    login: "nom_composé",
    password: "123",
    given_name: "Melissandre Juliette",
    family_name: "TROIS-DUPRE",
    preferred_username: "",
    gender: "female",
    email: "imyllommo-2736@yopmail.com",
    phone_number: "723456789",
    birthdate: "1981-07-27",
    birthplace: "13012",
    birthcountry: "99100",
  },
];
