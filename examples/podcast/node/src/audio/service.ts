/// <reference types="@cloudflare/workers-types" />

import { v4 as uuidv4 } from "uuid";
import { AudioRepository } from "./repository";
import { EventPublisher } from "../events/publisher";
import { EpisodeRepository } from "../episodes/repository";
import { NotFoundError } from "../common/errors";

export class AudioService {
  constructor(
    private audioRepository: AudioRepository,
    private episodeRepository: EpisodeRepository,
    private eventPublisher: EventPublisher,
    private bucket?: R2Bucket
  ) {}

  async getAudioMetadata(showId: string, episodeId: string) {
    return await this.audioRepository.findByEpisodeId(showId, episodeId);
  }

  async uploadAudio(
    showId: string,
    episodeId: string,
    file: {
      fileName: string;
      fileSize: number;
      mimeType: string;
      buffer: Buffer;
    }
  ) {
    // Verify episode exists
    const episode = await this.episodeRepository.findById(showId, episodeId);
    if (!episode) {
      throw new NotFoundError("Episode not found");
    }

    const audioId = uuidv4();
    const fileName = file.fileName;
    const key = `audio/${showId}/${episodeId}/${audioId}/${fileName}`;

    let url: string;

    if (this.bucket) {
      // Upload to R2 bucket
      await this.bucket.put(key, file.buffer, {
        httpMetadata: {
          contentType: file.mimeType,
        },
      });

      // For R2 public URL, you'll need to configure a custom domain or use R2.dev domain
      // This is a placeholder - in production you'd use your configured R2 public domain
      url = `https://podcast-service-assets.r2.dev/${key}`;
    } else {
      // Fallback for development/testing
      url = `https://storage.example.com/audio/${audioId}/${fileName}`;
    }

    // Save audio metadata
    const audioUpload = await this.audioRepository.create({
      id: audioId,
      episodeId,
      fileName: file.fileName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      url,
    });

    // Update episode with audio URL
    await this.episodeRepository.update(showId, episodeId, {
      audioUrl: url,
    });

    // Publish event
    await this.eventPublisher.publish(
      "audio.uploaded",
      audioUpload,
      audioUpload.id
    );

    return audioUpload;
  }
}
