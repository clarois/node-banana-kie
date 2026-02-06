> ## Documentation Index
> Fetch the complete documentation index at: https://docs.kie.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Extend Veo 3.1 AI Video

> Extend an existing Veo3.1 video by generating new content based on the original video and a text prompt.

<Info>
  Extend an existing Veo 3.1 video by generating new content based on the original video and a text prompt. This feature allows you to extend video duration or add new content based on your existing video clips.
</Info>

Our **Veo 3.1 Video Extension API** is more than simple video splicing. It layers intelligent extension algorithms on top of the official models, giving you greater flexibility and markedly higher success rates — **25% of the official Google pricing** (see [pricing details](https://kie.ai/pricing) for full details).

| Capability              | Details                                                                         |
| :---------------------- | :------------------------------------------------------------------------------ |
| **Smart Extension**     | Generate new video segments based on existing videos and text prompts           |
| **Seamless Connection** | Extended videos naturally connect with the original video                       |
| **Flexible Control**    | Precisely control the style and actions of extended content through prompts     |
| **High-Quality Output** | Maintain the same quality and style as the original video                       |
| **Audio Track**         | Extended videos default to background audio, consistent with the original video |

### Why our Veo 3.1 Video Extension is different

1. **Smart Content Understanding** – Deeply understands the content and style of the original video to ensure coherence of extended content.
2. **Natural Transition** – Extended video segments seamlessly connect with the original video without visible splicing marks.
3. **Flexible Control** – Precisely control the actions, scenes, and styles of extended content through detailed prompts.
4. **Significant Cost Savings** – Our rates are 25% of Google's direct API pricing.

***

### Video Extension Workflow

The video extension feature is based on your existing Veo3.1 generated videos and works through the following steps:

1. **Provide Original Video**: Use the `taskId` from the original video generation task
2. **Describe Extension Content**: Use `prompt` to detail how you want the video to be extended
3. **Smart Analysis**: The system analyzes the content, style, and actions of the original video
4. **Generate Extension**: Generate new video segments based on analysis results and your prompts
5. **Seamless Connection**: Naturally connect the extended video with the original video

## Request Parameters

<ParamField body="taskId" type="string" required>
  Task ID of the original video generation. Must be a valid taskId returned from the video generation interface. Note: Videos generated after 1080P generation cannot be extended.
</ParamField>

<ParamField body="prompt" type="string" required>
  Text prompt describing the extended video content. Should detail how you want the video to be extended, including actions, scene changes, style, etc.
</ParamField>

<ParamField body="seeds" type="integer">
  Random seed parameter for controlling the randomness of generated content. Range: 10000-99999. Same seeds will generate similar video content, different seeds will generate different video content. If not specified, the system will automatically assign random seeds.
</ParamField>

<ParamField body="watermark" type="string">
  Watermark text (optional). If provided, a watermark will be added to the generated video.
</ParamField>

<ParamField body="callBackUrl" type="string">
  Callback URL when the task is completed (optional). Strongly recommended for production environments.
</ParamField>

### Extension Features

<Info>
  Through the video extension feature, you can:

  * Extend video duration and add more content
  * Change video direction and add new actions or scenes
  * Add new elements while maintaining the original style
  * Create richer video stories
</Info>

**Extension Features:**

* **Smart Analysis**: Deeply understand the content and style of the original video
* **Natural Connection**: Extended content seamlessly connects with the original video
* **Flexible Control**: Precisely control extended content through prompts
* **Quality Assurance**: Maintain the same quality and style as the original video

<Warning>
  **Important Notes**

  * Can only extend videos generated through the Veo3.1 API
  * Extended content must also comply with platform content policies
  * Recommend using English prompts for best results
  * Video extension consumes credits, see [pricing Details](https://kie.ai/pricing) for specific pricing
</Warning>

### Best Practices

<Tip>
  ### Prompt Writing Suggestions

  1. **Detailed Action Description**: Clearly describe how you want the video to be extended, e.g., "the dog continues running through the park, jumping over obstacles"
  2. **Maintain Style Consistency**: Ensure the style of extended content matches the original video
  3. **Natural Transition**: Described actions should naturally connect with the end of the original video
  4. **Use English**: Recommend using English prompts for best results
  5. **Avoid Conflicts**: Ensure extended content doesn't create logical conflicts with the original video

  ### Technical Recommendations

  1. **Use Callbacks**: Strongly recommend using callback mechanisms to get results in production environments
  2. **Download Promptly**: Download video files promptly after generation, URLs have time limits
  3. **Error Handling**: Implement appropriate error handling and retry mechanisms
  4. **Credit Management**: Monitor credit usage to ensure sufficient balance
  5. **Seed Control**: Use the seeds parameter to control the randomness of generated content
</Tip>

## Important Notes

<Warning>
  ### Important Limitations

  * **Original Video Requirements**: Can only extend videos generated through the Veo3.1 API
  * **Content Policy**: Extended content must also comply with platform content policies
  * **Credit Consumption**: Video extension consumes credits, see [pricing Details](https://kie.ai/pricing) for specific pricing
  * **Processing Time**: Video extension may take several minutes to over ten minutes to process
  * **URL Validity**: Generated video URLs have time limits, please download and save promptly
</Warning>

<Note>
  ### Extended Video Features

  * **Seamless Connection**: Extended videos will naturally connect with the original video
  * **Quality Maintenance**: Extended videos maintain the same quality as the original video
  * **Style Consistency**: Extended content will maintain the visual style of the original video
  * **Flexible Control**: Prompts can precisely control the content and direction of extension
</Note>

## Troubleshooting

<AccordionGroup>
  <Accordion title="Common Error Handling">
    * **404 Error**: Check if task\_id and media\_id are correct
    * **400 Error**: Check if the prompt complies with content policies
    * **402 Error**: Confirm the account has sufficient credits
    * **500 Error**: Temporary server issue, please try again later
  </Accordion>

  <Accordion title="Extension Quality Issues">
    * **Unnatural Connection**: Try more detailed prompt descriptions
    * **Style Inconsistency**: Ensure the prompt includes style descriptions
    * **Disconnected Actions**: Check if action descriptions in the prompt are reasonable
    * **Content Deviation**: Adjust prompts to more accurately describe desired extension content
  </Accordion>

  <Accordion title="Technical Issues">
    * **Callback Receipt Failure**: Check if the callback URL is accessible
    * **Video Download Failure**: Confirm URL validity and network connection
    * **Abnormal Task Status**: Use the details query interface to check task status
    * **Insufficient Credits**: Recharge credits promptly to continue using the service
  </Accordion>
</AccordionGroup>


## OpenAPI

````yaml veo3-api/veo3-api.json post /api/v1/veo/extend
openapi: 3.0.0
info:
  title: Veo3.1 API
  description: kie.ai Veo3.1 API Documentation - Text-to-Video and Image-to-Video API
  version: 1.0.0
  contact:
    name: Technical Support
    email: support@kie.ai
servers:
  - url: https://api.kie.ai
    description: API Server
security:
  - BearerAuth: []
paths:
  /api/v1/veo/extend:
    post:
      summary: Extend Veo3.1 Video
      description: >-
        Extend an existing Veo3.1 video by generating new content based on the
        original video and a text prompt.
      operationId: extend-veo3-1-video
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                taskId:
                  type: string
                  description: >-
                    Task ID of the original video generation. Must be a valid
                    taskId returned from the video generation interface. Note:
                    Videos generated after 1080P generation cannot be extended.
                  example: veo_task_abcdef123456
                prompt:
                  type: string
                  description: >-
                    Text prompt describing the extended video content. Should
                    detail how you want the video to be extended, including
                    actions, scene changes, style, etc.
                  example: >-
                    The dog continues running through the park, jumping over
                    obstacles and playing with other dogs
                seeds:
                  type: integer
                  description: >-
                    Random seed parameter for controlling the randomness of
                    generated content. Range: 10000-99999. Same seeds will
                    generate similar video content, different seeds will
                    generate different video content. If not specified, the
                    system will automatically assign random seeds.
                  minimum: 10000
                  maximum: 99999
                  example: 12345
                watermark:
                  type: string
                  description: >-
                    Watermark text (optional). If provided, a watermark will be
                    added to the generated video.
                  example: MyBrand
                callBackUrl:
                  type: string
                  description: >-
                    Callback URL when the task is completed (optional). Strongly
                    recommended for production environments.


                    - The system will send a POST request to this URL when video
                    extension is completed, containing task status and results

                    - The callback contains generated video URLs, task
                    information, etc.

                    - Your callback endpoint should accept POST requests with
                    JSON payloads containing video results

                    - For detailed callback format and implementation guide, see
                    [Video Generation
                    Callbacks](https://docs.kie.ai/veo3-api/generate-veo-3-video-callbacks)

                    - To ensure callback security, see [Webhook Verification
                    Guide](/common-api/webhook-verification) for signature
                    verification implementation

                    - Alternatively, you can use [the get video details
                    interface](https://docs.kie.ai/veo3-api/get-veo-3-video-details)
                    to poll task status
                  example: https://your-callback-url.com/veo-extend-callback
                model:
                  type: string
                  description: >-
                    Model type for video extension (optional). Defaults to
                    `fast` if not specified.


                    - **fast**: Fast generation mode

                    - **quality**: High quality generation mode
                  enum:
                    - fast
                    - quality
                  default: fast
                  example: fast
              required:
                - taskId
                - prompt
              example:
                taskId: veo_task_abcdef123456
                prompt: >-
                  The dog continues running through the park, jumping over
                  obstacles and playing with other dogs
                seeds: 12345
                watermark: MyBrand
                callBackUrl: https://your-callback-url.com/veo-extend-callback
                model: fast
      responses:
        '200':
          description: Request successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    enum:
                      - 200
                      - 400
                      - 401
                      - 402
                      - 404
                      - 422
                      - 429
                      - 455
                      - 500
                      - 501
                      - 505
                    description: >-
                      Response status code


                      - **200**: Success - Extension task created

                      - **400**: Client error - Prompt violates content policy
                      or other input errors

                      - **401**: Unauthorized - Authentication credentials
                      missing or invalid

                      - **402**: Insufficient credits - Account does not have
                      enough credits to perform the operation

                      - **404**: Not found - Original video or task does not
                      exist

                      - **422**: Validation error - Request parameter validation
                      failed

                      - **429**: Rate limit - Exceeded the request limit for
                      this resource

                      - **455**: Service unavailable - System is under
                      maintenance

                      - **500**: Server error - Unexpected error occurred while
                      processing the request

                      - **501**: Extension failed - Video extension task failed

                      - **505**: Feature disabled - The requested feature is
                      currently disabled
                  msg:
                    type: string
                    description: Response message
                    example: success
                  data:
                    type: object
                    properties:
                      taskId:
                        type: string
                        description: >-
                          Task ID that can be used to query task status via the
                          get video details interface
                        example: veo_extend_task_xyz789
                example:
                  code: 200
                  msg: success
                  data:
                    taskId: veo_extend_task_xyz789
        '500':
          $ref: '#/components/responses/Error'
      callbacks:
        onVideoExtended:
          '{$request.body#/callBackUrl}':
            post:
              summary: Video Extension Callback
              description: >-
                When the video extension task is completed, the system will send
                the result to your provided callback URL via POST request
              requestBody:
                required: true
                content:
                  application/json:
                    schema:
                      type: object
                      properties:
                        code:
                          type: integer
                          description: >-
                            Status code


                            - **200**: Success - Video extension task successful

                            - **400**: Your prompt was flagged by the website as
                            violating content policies.

                            English prompts only.

                            Unable to retrieve image. Please verify any access
                            restrictions set by you or your service provider.

                            Public error: Unsafe image upload.

                            - **500**: Internal error, please try again later.

                            Internal error - Timeout

                            - **501**: Failed - Video extension task failed
                          enum:
                            - 200
                            - 400
                            - 500
                            - 501
                        msg:
                          type: string
                          description: Status message
                          example: Veo3.1 video extension successful.
                        data:
                          type: object
                          properties:
                            taskId:
                              type: string
                              description: Task ID
                              example: veo_extend_task_xyz789
                            info:
                              type: object
                              properties:
                                resultUrls:
                                  type: string
                                  description: Extended video URLs
                                  example: '[http://example.com/extended_video1.mp4]'
                                originUrls:
                                  type: string
                                  description: >-
                                    Original video URLs. Only available when
                                    aspect_ratio is not 16:9
                                  example: '[http://example.com/original_video1.mp4]'
                                resolution:
                                  type: string
                                  description: Video resolution information
                                  example: 1080p
                            fallbackFlag:
                              type: boolean
                              description: >-
                                Whether generated through fallback model. true
                                means using backup model generation, false means
                                using main model generation
                              example: false
                              deprecated: true
              responses:
                '200':
                  description: Callback received successfully
components:
  responses:
    Error:
      description: Server Error
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: API Key
      description: >-
        All APIs require authentication via Bearer Token.


        Get API Key: 

        1. Visit [API Key Management Page](https://kie.ai/api-key) to get your
        API Key


        Usage:

        Add to request header:

        Authorization: Bearer YOUR_API_KEY

````