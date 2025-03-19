import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

// Base URL for the Moon API
const MOON_API_BASE_URL = 'https://stagingapi.paywithmoon.com/v1/api-gateway'

// API key from environment variables
const API_KEY = process.env.MOON_API_KEY

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Extract the path from the request
    const { path } = req.query
    const pathString = Array.isArray(path) ? path.join('/') : path || ''
    
    // Make the request to the API
    const response = await axios({
      method: req.method,
      url: `${MOON_API_BASE_URL}/${pathString}`,
      params: req.method === 'GET' ? req.query : undefined,
      data: req.method !== 'GET' ? req.body : undefined,
      headers: {
        'Content-Type': 'application/json',
        // Include API key if available
        'X-API-Key': API_KEY || '',
        // Forward authorization header if present
        ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {})
      }
    })

    return res.status(200).json(response.data)
  } catch (error) {
    console.error('API proxy error:', error)
    
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json(error.response.data)
    }
    
    return res.status(500).json({ message: 'Internal server error' })
  }
}