import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { useState } from "react";
import * as Tabs from '@radix-ui/react-tabs';
import {
  MintNFT,
} from "./NFT";

function App() {
  const [activeTab, setActiveTab] = useState<"create" | "transfer" | "swap">("create");

  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{ borderBottom: "1px solid var(--gray-a2)" }}
      >
        <Box>
          <Heading>NFT DApp</Heading>
        </Box>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          <Tabs.Root
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as typeof activeTab)}
            >
              <Tabs.List style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <Tabs.Trigger value="create">Mint NFT</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="create">
                <MintNFT onCreated={(swordId) => console.log("Created sword:", swordId)} />
              </Tabs.Content>
          </Tabs.Root>
        </Container>
      </Container>
    </>
  );
}

export default App;
