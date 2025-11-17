import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface EventPrivacySettingsProps {
  accessLevel: string;
  maxAttendees: number | null;
  enableCheckIn: boolean;
  enablePhotos: boolean;
  isRecurrent: boolean;
  trackPayments: boolean;
  instagramPostUrl: string;
  onAccessLevelChange: (value: string) => void;
  onMaxAttendeesChange: (value: number | null) => void;
  onEnableCheckInChange: (value: boolean) => void;
  onEnablePhotosChange: (value: boolean) => void;
  onIsRecurrentChange: (value: boolean) => void;
  onTrackPaymentsChange: (value: boolean) => void;
  onInstagramPostUrlChange: (value: string) => void;
}

export const EventPrivacySettings = ({
  accessLevel,
  maxAttendees,
  enableCheckIn,
  enablePhotos,
  isRecurrent,
  trackPayments,
  instagramPostUrl,
  onAccessLevelChange,
  onMaxAttendeesChange,
  onEnableCheckInChange,
  onEnablePhotosChange,
  onIsRecurrentChange,
  onTrackPaymentsChange,
  onInstagramPostUrlChange
}: EventPrivacySettingsProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="accessLevel">Event Privacy</Label>
        <Select value={accessLevel} onValueChange={onAccessLevelChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public - Anyone can see and join</SelectItem>
            <SelectItem value="private">Private - Visible but requires invite code</SelectItem>
            <SelectItem value="invite_only">Invite Only - Hidden from listings</SelectItem>
            <SelectItem value="secret">Secret - Hidden, direct link only</SelectItem>
          </SelectContent>
        </Select>
        {accessLevel !== 'public' && (
          <p className="text-sm text-muted-foreground">
            {accessLevel === 'private' && "Event will be visible but location and description are hidden. Users need an invite code to join."}
            {accessLevel === 'invite_only' && "Event won't appear in public listings. Only users with invite code or direct link can access."}
            {accessLevel === 'secret' && "Event is completely hidden. Only accessible via direct link and invite code."}
          </p>
        )}
      </div>

      {(accessLevel === 'private' || accessLevel === 'invite_only' || accessLevel === 'secret') && (
        <div className="space-y-2">
          <Label htmlFor="maxAttendees">Max Attendees</Label>
          <Input
            id="maxAttendees"
            type="number"
            min="1"
            value={maxAttendees || ''}
            onChange={(e) => onMaxAttendeesChange(e.target.value ? parseInt(e.target.value) : null)}
            placeholder="No limit"
          />
          <p className="text-sm text-muted-foreground">
            Leave empty for no limit
          </p>
        </div>
      )}

      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:underline">
          <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          Show more options
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enableCheckIn">Enable Check-In</Label>
              <p className="text-sm text-muted-foreground">
                Allow attendees to check in when the event starts
              </p>
            </div>
            <Switch
              id="enableCheckIn"
              checked={enableCheckIn}
              onCheckedChange={onEnableCheckInChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enablePhotos">Enable Photo Gallery</Label>
              <p className="text-sm text-muted-foreground">
                Allow attendees to upload and share event photos
              </p>
            </div>
            <Switch
              id="enablePhotos"
              checked={enablePhotos}
              onCheckedChange={onEnablePhotosChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isRecurrent">Recurrent Event</Label>
              <p className="text-sm text-muted-foreground">
                Mark this as a recurring event
              </p>
            </div>
            <Switch
              id="isRecurrent"
              checked={isRecurrent}
              onCheckedChange={onIsRecurrentChange}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="trackPayments">Track Payments</Label>
              <p className="text-sm text-muted-foreground">
                Require attendees to upload payment receipts
              </p>
            </div>
            <Switch
              id="trackPayments"
              checked={trackPayments}
              onCheckedChange={onTrackPaymentsChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagramPostUrl">Instagram Post</Label>
            <Input
              id="instagramPostUrl"
              type="url"
              value={instagramPostUrl}
              onChange={(e) => onInstagramPostUrlChange(e.target.value)}
              placeholder="https://www.instagram.com/p/POST_ID/"
            />
            <p className="text-sm text-muted-foreground">
              Paste the link to an Instagram post to embed it on the event page
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
