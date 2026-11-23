const directory = `${import.meta.env.BASE_URL}icons/oaic/`

export const oaicLogos = [
  ['df6c45cc-0132-4db3-8ea5-56d81e581703_20261123_212953_0000.png', 'Siksha ‘O’ Anusandhan', 128, 128],
  ['83a38445-ab0e-478c-af69-1fd66162d781_20261123_212913_0000.png', 'AIC-SOA Foundation', 249, 128],
  ['8f4a30ff-3706-41c3-9a3e-b99c10dbb7a3_20261123_213149_0000.png', 'IEEE Bhubaneswar Section', 234, 128],
  ['25ea942f-04c6-4957-8c69-491358090397_20261123_213023_0000.png', 'IEEE Future Networks', 143, 128],
  ['fa0e3a25-5a10-478e-b4fe-3ee7a95a2635_20261123_213048_0000.png', 'IEEE Computer Society', 126, 128],
  ['a8fc0782-f747-40ff-ae43-22f608d74703_20261123_213525_0000.png', 'IEEE 5G/6G Innovation Testbed', 219, 128],
  ['5ad8b512-0e47-4665-976b-b739448e951b_20261123_213126_0000.png', 'Odisha Society of UK', 250, 128],
  ['33a5fad1-9414-476f-aeeb-676a41e0848a_20261123_213416_0000.png', 'Odisha, Canada and United States partner marks', 260, 90],
  ['GFG.png', 'GeeksforGeeks Campus Body ITER', 186, 128],
].map(([filename, alt, width, height]) => ({ filename, alt, width, height, src: directory + filename }))

export const oaicOrganizerLogos = oaicLogos.filter(({ filename }) => !filename.toLowerCase().includes('gfg'))
