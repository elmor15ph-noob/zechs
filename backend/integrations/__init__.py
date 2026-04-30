"""DUO Brain App — integrations package.

Public API::

    from integrations import OpenClawBridge, ChannelConfig
"""

from integrations.channel_config import ChannelConfig
from integrations.openclaw_bridge import OpenClawBridge

__all__ = ["OpenClawBridge", "ChannelConfig"]
