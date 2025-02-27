import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const API_KEY_0x = process.env.API_KEY_0x
const URL_0x = 'https://api.0x.org'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests for now
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const response = await axios.get(`${URL_0x}/swap/permit2/price`, {
      params: req.query,
      headers: {
        '0x-api-key': API_KEY_0x,
        '0x-version': 'v2'
      }
    })

    return res.status(200).json(response.data)
  } catch (error) {
    console.error('Error proxying to 0x API:', error)
    
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json(error.response.data)
    }
    
    return res.status(500).json({ message: 'Error proxying to 0x API' })
  }
}