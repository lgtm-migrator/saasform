import { Controller, Get, Post, Request, Res } from '@nestjs/common'
import { Response } from 'express'
import { SettingsService } from '../../../settings/settings.service'
import { AuthService } from '../../../auth/auth.service'

@Controller('/api/v1')
export class ApiV1AutheticationController {
  constructor (
    private readonly authService: AuthService,
    private readonly settingsService: SettingsService
  ) {}

  @Get()
  async getHello (@Request() req, @Res() res: Response): Promise<any> {
    return res.json({
      statusCode: 200,
      message: 'Hello, World!'
    })
  }

  async issueJwtAndRedirect (req, res, user): Promise<Response> {
    const requestUser = await this.authService.getTokenPayloadFromUserModel(user)
    if (requestUser == null) {
      console.error('API V1 - issueJwtAndRediret - requestUser not valid')
      return res.status(500).json({
        statusCode: 500,
        message: 'Server error'
      })
    }

    await this.authService.setJwtCookie(req, res, requestUser)
    const redirect = await this.settingsService.getRedirectAfterLogin()

    return res.status(302).json({
      statusCode: 302,
      message: 'Found',
      redirect
    })
  }

  @Post('login')
  async handleLogin (@Request() req, @Res() res: Response): Promise<any> {
    const { email, password } = req.body

    if (email == null || password == null) {
      return res.status(400).json({
        statusCode: 400,
        message: 'Missing parameters (email or password)'
      })
    }

    const user = await this.authService.validateUser(email, password)
    if (user == null) {
      return res.status(401).json({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }

    return await this.issueJwtAndRedirect(req, res, user)
  }

  @Post('signup')
  async handleSignup (@Request() req, @Res() res: Response): Promise<any> {
    const response = res
    const { email, password, account } = req.body

    if (email == null || password == null) {
      return response.status(400).json({
        statusCode: 400,
        message: 'Missing parameters (email or password)'
      })
    }

    const user = await this.authService.registerUser(email, password, account)
    if (user == null) {
      return response.status(409).json({
        statusCode: 409,
        message: 'Already registered'
      })
    }

    return await this.issueJwtAndRedirect(req, res, user)
  }

  @Get('/public-key')
  async getPublicKey (@Request() req, @Res() res: Response): Promise<any> {
    const publicKey = await this.settingsService.getJWTPublicKey()

    return res.status(200).json({
      statusCode: 200,
      message: publicKey
    })
  }
}
