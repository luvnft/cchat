import React, {useState} from 'react';
import {useMqParser} from '../../lib/tailwind-mqp';
import {RgbaColorPicker} from 'react-colorful';

export function DesignRoomInfo({
  iOwn,
  backgroundURI,
  setBackgroundURI,
  paletteColors,
  color,
  setColor,
  colorPickerBg,
  colorPickerAvatar,
  colorPickerButton,
  setColorPickerBg,
  setColorPickerAvatar,
  setColorPickerButton,
  customBg,
  setCustomBg,
  customAvatar,
  setCustomAvatar,
  customButtons,
  setCustomButtons,
  styleBg,
  styleAvatar,
  styleButtons,
  tooltipStates,
  setTooltipStates,
}) {
  let mqp = useMqParser();
  let [expanded, setExpanded] = useState(false);
  let [colorType, setColorType] = useState('');

  function displayTooltip(index, colorType) {
    setTooltipStates(prevStates =>
      prevStates.map((state, i) => (i === index ? true : state))
    );
    setColorType(colorType);
  }

  function hideTooltip(index) {
    setTooltipStates(prevStates =>
      prevStates.map((state, i) => (i === index ? false : state))
    );
    setColorType('');
  }

  function PaletteColor() {
    return (
      <>
        {paletteColors.map((colorPalette, index) => {
          const colorThemeName = colorPalette[0];
          let palettekey = `palettekey_${index}`;
          return (
            <div
              key={palettekey}
              className={
                color === colorThemeName
                  ? 'border-2 m-2 pb-2 rounded-lg border-blue-500'
                  : 'cursor-pointer border-2 m-2 pb-2 rounded-lg hover:border-blue-500'
              }
              onClick={() => setColor(colorThemeName)}
              onMouseLeave={() => hideTooltip(index)}
            >
              <div className="mx-2 my-2 h-20 flex flex-col justify-between">
                <div>{colorThemeName}</div>
                <div className="flex">
                  <div
                    onMouseEnter={() => displayTooltip(index, 'Background')}
                    className="w-1/5 p-4"
                    style={{backgroundColor: colorPalette[1].background}}
                  ></div>

                  <div
                    className="w-1/5 p-4"
                    onMouseEnter={() =>
                      displayTooltip(index, 'Panel background')
                    }
                    style={{backgroundColor: colorPalette[1].avatarBg}}
                  ></div>

                  <div
                    className="w-1/5 p-4"
                    onMouseEnter={() => displayTooltip(index, 'Buttons')}
                    style={{backgroundColor: colorPalette[1].buttons.primary}}
                  ></div>
                </div>
                <div>
                  {tooltipStates[index] ? (
                    <p className="text-center text-xs">{colorType}</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div>

      <p className="text-lg font-medium text-gray-200 cursor-pointer" onClick={() => setExpanded(!expanded)}>
      {expanded ? '🔽' : '▶️'} Designer Settings
      </p>
      <div className={expanded ? '' : 'hidden'}>
      <p className="text-sm font-medium text-gray-300">
        Background Image URI: {!iOwn && (backgroundURI)}
      </p>
      {iOwn && (
      <input
        className={mqp(
          'rounded-lg placeholder-black bg-gray-400 text-black border-4 m-2 pb-2 rounded-lg w-full md:w-96'
        )}
        type="text"
        placeholder="Background Image URI"
        value={backgroundURI}
        name="room background image URI"
        style={{
          fontSize: '15px',
        }}
        onChange={e => {
          setBackgroundURI(e.target.value);
        }}
      ></input>
      )}

      {iOwn ? (
      <div className="my-2">
        <span className="flex items-center text-sm font-medium text-gray-300">
          Choose a Color Theme:  <b>{color}</b>
        </span>
        <div className="flex flex-wrap justify-between">
          <PaletteColor />
        </div>

        { color === 'customColor' && (
        <div className="text-sm">
        <p className="text-sm font-medium text-gray-300 p-2">
          Choose your custom colors:
        </p>
        {colorPickerBg ? (
          <div className="w-full">
            <RgbaColorPicker
              color={customBg}
              onChange={setCustomBg}
              style={{width: '100%'}}
            />
          </div>
        ) : null}
        {colorPickerAvatar ? (
          <div>
            <RgbaColorPicker
              color={customAvatar}
              onChange={setCustomAvatar}
              style={{width: '100%'}}
            />
          </div>
        ) : null}
        {colorPickerButton ? (
          <div>
            <RgbaColorPicker
              color={customButtons}
              onChange={setCustomButtons}
              style={{width: '100%'}}
            />
          </div>
        ) : null}
        <div className="mt-3">
          <div className="flex flex-wrap justify-between mt-3">
            <div
              className={'mx-1.5 cursor-pointer flex border-2 m-2 pb-2 rounded-lg ' + (colorPickerBg ? 'border-blue-500' : 'hover:border-blue-500')}
              onClick={() => {
                setColorPickerBg(!colorPickerBg);
                setColorPickerAvatar(false);
                setColorPickerButton(false);
              }}
            >
              <div
                className="w-8 h-8 rounded-full"
                style={{
                  backgroundColor: styleBg,
                }}
              ></div>
              <div className="flex text-xs">Background / Alternate</div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex flex-wrap justify-between mt-3">
            <div
              className={'mx-1.5 cursor-pointer flex border-2 m-2 pb-2 rounded-lg ' + (colorPickerAvatar ? 'border-blue-500' : 'hover:border-blue-500')}
              onClick={() => {
                setColorPickerAvatar(!colorPickerAvatar);
                setColorPickerBg(false);
                setColorPickerButton(false);
              }}
            >
              <div
                className="w-8 h-8 rounded-full"
                style={{backgroundColor: styleAvatar}}
              ></div>
              <div className="flex text-xs">Panel background</div>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex flex-wrap justify-between mt-3">
            <div
              className={'mx-1.5 cursor-pointer flex border-2 m-2 pb-2 rounded-lg ' + (colorPickerButton ? 'border-blue-500' : 'hover:border-blue-500')}
              onClick={() => {
                setColorPickerButton(!colorPickerButton);
                setColorPickerBg(false);
                setColorPickerAvatar(false);
              }}
            >
              <div
                className="w-8 h-8 rounded-full"
                style={{backgroundColor: styleButtons}}
              ></div>
              <div className="flex text-xs">Buttons</div>
            </div>
          </div>
        </div>
        </div>
        )}
      </div>
      ) : (
      <div className="my-2">
        <span className="flex items-center text-sm font-medium text-gray-300">
          Color Theme:  <b>{color}</b>
        </span>
      </div>
      )}
      </div>
    </div>
  );
}
