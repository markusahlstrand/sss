import { v4 as uuidv4 } from "uuid";
import { AudioRepository } from "./repository";
import { EventPublisher } from "../events/publisher";
import { EpisodeRepository } from "../episodes/repository";
import { NotFoundError } from "../common/errors";

export class AudioService {
  constructor(
    private audioRepository: AudioRepository,
    private episodeRepository: EpisodeRepository,
    private eventPublisher: EventPublisher
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

    // For this example, we'll simulate storing the file and return a URL
    // In production, you would upload to cloud storage (S3, GCS, etc.)
    const audioId = uuidv4();
    const fileName = file.fileName;
    const url = `https://storage.example.com/audio/${audioId}/${fileName}`;

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
